# Deploying C.R.E.A.M. CRM to Hetzner

## Step 1: Set up Hetzner Server

1. Create a Hetzner Cloud server (Ubuntu 22.04 recommended)
2. SSH into your server: `ssh root@your-hetzner-ip`

## Step 2: Install PostgreSQL on Hetzner

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 3: Create Database and User

```bash
sudo -u postgres psql
```

In PostgreSQL:
```sql
CREATE DATABASE cream_crm;
CREATE USER cream_admin WITH PASSWORD 'CreamCoffee2024!';
GRANT ALL PRIVILEGES ON DATABASE cream_crm TO cream_admin;
\q
```

## Step 4: Import Schema

Copy schema.sql to server, then:
```bash
sudo -u postgres psql cream_crm < schema.sql
sudo -u postgres psql cream_crm -c "GRANT ALL ON SCHEMA public TO cream_admin;"
sudo -u postgres psql cream_crm -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cream_admin;"
sudo -u postgres psql cream_crm -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cream_admin;"
```

## Step 5: Configure Remote Access

Edit `/etc/postgresql/14/main/postgresql.conf`:
```
listen_addresses = '*'
```

Edit `/etc/postgresql/14/main/pg_hba.conf`, add:
```
host    cream_crm    cream_admin    0.0.0.0/0    md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## Step 6: Firewall

```bash
sudo ufw allow 5432/tcp
```

## Connection String

```
postgresql://cream_admin:CreamCoffee2024!@your-hetzner-ip:5432/cream_crm
```

## Security Notes

⚠️ Change the default password before production!
⚠️ Consider using SSL for database connections
⚠️ Restrict IP access in pg_hba.conf to your app server only
