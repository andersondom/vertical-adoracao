#!/usr/bin/env python3
"""Auditoria local, somente leitura, dos backups D1. Não imprime dados pessoais."""
import argparse
import hashlib
import sqlite3
from pathlib import Path

def load(path):
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    db.executescript(Path(path).read_text(encoding="utf-8-sig"))
    return db

def rows(db, sql):
    return [dict(r) for r in db.execute(sql)]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--staging", default="backups/louvor-staging-20261027.sql")
    parser.add_argument("--production", default="backups/louvor-db-20261027.sql")
    args = parser.parse_args()
    s, p = load(args.staging), load(args.production)
    try:
        for label, db in (("STAGING", s), ("PRODUCAO", p)):
            print("\n"+label)
            for t in rows(db, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"):
                name = t["name"]
                if not name.replace("_","").isalnum(): continue
                print(f"  {name}: {db.execute('SELECT COUNT(*) FROM '+name).fetchone()[0]}")
            print("  foreign_key_check:", len(rows(db, "PRAGMA foreign_key_check")))
        def users(db):
            return {r["email"].strip().lower():r for r in rows(db, "SELECT id,email,role,active FROM users")}
        su, pu = users(s), users(p)
        print("\nUSUARIOS EXCLUSIVOS DO STAGING (hash do email):")
        for email in sorted(su.keys()-pu.keys()):
            print(" ", hashlib.sha256(email.encode()).hexdigest()[:12], "role=", su[email]["role"])
        print("USUARIOS EXCLUSIVOS DA PRODUCAO:",len(pu.keys()-su.keys()))
        def events(db):
            return {r["event_date"]:r for r in rows(db,"SELECT id,event_date,day_code,title,icon FROM events")}
        se, pe = events(s), events(p)
        print("\nEVENTOS EXCLUSIVOS DO STAGING:",sorted(se.keys()-pe.keys()))
        print("EVENTOS EXCLUSIVOS DA PRODUCAO:",sorted(pe.keys()-se.keys()))
        print("EVENTOS COM DIVERGENCIA DE CONTEUDO:")
        for d in sorted(se.keys()&pe.keys()):
            if any(se[d][k]!=pe[d][k] for k in ("day_code","title","icon")):
                print(" ",d, "staging=",tuple(se[d][k] for k in ("day_code","title","icon")),"producao=",tuple(pe[d][k] for k in ("day_code","title","icon")))
        print("\nResultado: diagnóstico somente leitura. Nenhuma migração gerada ou aplicada.")
    finally:
        s.close();p.close()
if __name__ == "__main__":
    main()
