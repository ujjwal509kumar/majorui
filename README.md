
## How to run on local machine

Clone the project

```bash
  git clone https://github.com/ujjwal509kumar/majorui.git
```

Go to the project directory

```bash
  cd majorui
```

Now open vs code and install dependencies for fastapi server

```bash
  code .
  pip install -r requirements.txt
```

Now Install dependencies for next and node js

```bash
  npm i
```

Now create .env file and enter your creds for

```bash
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
NEXTAUTH_URL=""
NEXTAUTH_SECRET=""
DATABASE_URL=""
```

Now migrate the prisma schema

```bash
  npx prisma migrate dev --name m1
```

Now start the fast api backend server

```bash
  python -m uvicorn app:app --reload
```

Now start the next js app  
```
  npm run dev
```

