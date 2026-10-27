#!/usr/bin/env python3
"""Gera SQL de conciliacao staging -> producao, sem executar no Cloudflare.

Uso: python scripts/preparar-migracao-d1.py
O script verifica a migracao em copia SQLite em memoria e gera arquivo LOCAL
em backups/ (NUNCA commitar). Nao imprime dados pessoais.
"""
import sqlite3
from pathlib import Path

ROOT = Path("backups")
STAGING = ROOT / "louvor-staging-20261027.sql"
PRODUCTION = ROOT / "louvor-db-20261027.sql"
OUTPUT = ROOT / "migracao-staging-para-producao-20261027.sql"

def load(path):
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    db.executescript(path.read_text(encoding="utf-8-sig"))
    return db

def quoted(db, value):
    return db.execute("SELECT quote(?)", (value,)).fetchone()[0]

def columns(db, table):
    return [r["name"] for r in db.execute(f"PRAGMA table_info({table})")]

def record_insert(db, table, record, omit=("id",)):
    cols = [c for c in columns(db, table) if c in record.keys() and c not in omit]
    return f"INSERT INTO {table} ({','.join(cols)}) SELECT " + ",".join(quoted(db, record[c]) for c in cols)

def main():
    s, p = load(STAGING), load(PRODUCTION)
    try:
        if s.execute("PRAGMA foreign_key_check").fetchall() or p.execute("PRAGMA foreign_key_check").fetchall():
            raise RuntimeError("Backup com violacao de chave estrangeira")
        if {r["name"] for r in s.execute("SELECT name FROM sqlite_master WHERE type='table'")} != {r["name"] for r in p.execute("SELECT name FROM sqlite_master WHERE type='table'")}:
            raise RuntimeError("Esquemas de tabelas diferentes")
        su = list(s.execute("SELECT * FROM users"))
        pu = list(p.execute("SELECT * FROM users"))
        semail = {r["email"].strip().lower():r for r in su}
        pemail = {r["email"].strip().lower():r for r in pu}
        if any(r["role"] == "admin" and email not in pemail for email,r in semail.items()):
            raise RuntimeError("Administrador diferente: revisao manual obrigatoria")
        if any(pemail[email]["role"] != r["role"] for email,r in semail.items() if email in pemail):
            raise RuntimeError("Conflito de perfis: revisao manual obrigatoria")
        events_s = {r["id"]:r for r in s.execute("SELECT * FROM events")}
        events_p = {r["event_date"]:r for r in p.execute("SELECT * FROM events")}
        if set(r["event_date"] for r in events_s.values()) != set(events_p):
            raise RuntimeError("Eventos com datas diferentes: revisao manual obrigatoria")
        roles_s = {r["id"]:r["code"] for r in s.execute("SELECT id,code FROM ministry_roles")}
        roles_p = {r["code"] for r in p.execute("SELECT id,code FROM ministry_roles")}
        if set(roles_s.values()) != set(roles_p):
            raise RuntimeError("Funcoes diferentes: revisao manual obrigatoria")
        stmts = ["BEGIN TRANSACTION;"]
        new_users = [r for email,r in semail.items() if email not in pemail]
        for r in new_users:
            if r["role"] != "member":
                raise RuntimeError("Somente novos integrantes comuns podem ser importados")
            stmt = record_insert(s,"users",r)
            stmts.append(stmt + " WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email)=" + quoted(s,r["email"].strip().lower()) + ");")
        # Nunca copiar IDs dos eventos nem usuarios. Resolucao por email/data.
        def ref_user(uid):
            r = next((x for x in su if x["id"] == uid),None)
            if r is None: raise RuntimeError("Usuario referenciado inexistente")
            return "(SELECT id FROM users WHERE lower(email)=" + quoted(s,r["email"].strip().lower()) + ")"
        def ref_event(eid):
            if eid not in events_s: raise RuntimeError("Evento referenciado inexistente")
            return "(SELECT id FROM events WHERE event_date=" + quoted(s,events_s[eid]["event_date"]) + ")"
        def ref_role(rid):
            if rid not in roles_s: raise RuntimeError("Funcao referenciada inexistente")
            return "(SELECT id FROM ministry_roles WHERE code=" + quoted(s,roles_s[rid]) + ")"
        for r in s.execute("SELECT * FROM availability"):
            e,u = ref_event(r["event_id"]),ref_user(r["user_id"])
            fields = columns(s,"availability")
            vals = {"event_id":e,"user_id":u,"available":str(int(r["available"]))}
            if "updated_at" in fields and r["updated_at"] is not None:
                vals["updated_at"] = quoted(s,r["updated_at"])
            stmts.append("INSERT INTO availability ("+",".join(vals)+") SELECT "+",".join(vals.values())+" WHERE NOT EXISTS (SELECT 1 FROM availability WHERE event_id="+e+" AND user_id="+u+");")
        for r in s.execute("SELECT * FROM event_role_requirements"):
            e,role = ref_event(r["event_id"]),ref_role(r["role_id"])
            stmts.append("INSERT INTO event_role_requirements (event_id,role_id,slots) SELECT "+e+","+role+","+str(int(r["slots"]))+" WHERE NOT EXISTS (SELECT 1 FROM event_role_requirements WHERE event_id="+e+" AND role_id="+role+");")
        for r in s.execute("SELECT * FROM member_roles"):
            u,role=ref_user(r["user_id"]),ref_role(r["role_id"])
            stmts.append("INSERT INTO member_roles (user_id,role_id) SELECT "+u+","+role+" WHERE NOT EXISTS (SELECT 1 FROM member_roles WHERE user_id="+u+" AND role_id="+role+");")
        # Diferenca de titulo e icone: somente atualizar valores vazios/padrao.
        for event in events_s.values():
            old=events_p[event["event_date"]]
            if (event["title"],event["icon"]) != (old["title"],old["icon"]):
                if old["title"] is not None or old["icon"] not in ("🙏","🎶"):
                    raise RuntimeError("Conflito de evento: "+event["event_date"])
                stmts.append("UPDATE events SET title="+quoted(s,event["title"])+",icon="+quoted(s,event["icon"])+" WHERE event_date="+quoted(s,event["event_date"])+" AND title IS NULL AND icon="+quoted(s,old["icon"])+";")
        stmts.append("COMMIT;")
        sql="\n".join(stmts)+"\n"
        # Teste em memoria; repetir garante idempotencia e integridade.
        before={t:p.execute("SELECT COUNT(*) FROM "+t).fetchone()[0] for t in ("users","availability","event_role_requirements","assignments","member_roles")}
        p.executescript(sql)
        once={t:p.execute("SELECT COUNT(*) FROM "+t).fetchone()[0] for t in before}
        if p.execute("PRAGMA foreign_key_check").fetchall():
            raise RuntimeError("Migracao viola chaves estrangeiras")
        p.executescript(sql)
        twice={t:p.execute("SELECT COUNT(*) FROM "+t).fetchone()[0] for t in before}
        if once!=twice: raise RuntimeError("Migracao nao idempotente")
        if once["assignments"]!=before["assignments"]: raise RuntimeError("Escalacoes alteradas")
        if once["users"]!=len(set(semail)|set(pemail)): raise RuntimeError("Contagem de usuarios inesperada")
        OUTPUT.write_text("-- GERADO A PARTIR DE BACKUPS; CONFERIR ATUALIDADE DO REMOTO ANTES DE EXECUTAR\n"+sql,encoding="utf-8")
        print("SIMULACAO LOCAL APROVADA; migracao gerada:",OUTPUT)
        for table in before: print(table,before[table],"->",once[table])
        print("NENHUMA ALTERACAO REMOTA FOI EXECUTADA.")
    finally:
        s.close();p.close()

if __name__=="__main__":
    main()
