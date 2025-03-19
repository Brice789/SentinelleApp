

███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗     
██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║     
███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║     
╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║     
███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
                                                                



This project is a web security test automation API that performs
analyses with Nmap, Nuclei and Nikto to identify security flaws in a 
website. It runs in Docker mode and uses FastAPI as its backend.

first start the frontend (instruction in the frontend README)

---

#### **0. Construct or Rebuild Containers**
If you have modified the source code and want to force a rebuild :
```
docker-compose up --build # Rebuild images before booting
docker-compose build # Build images without starting containers
```

### **1. Managing Docker Containers
#### **Start, Stop and Clean Docker**
```
docker-compose up # Launch Containers 
docker-compose up -d # Launch containers in the background (detached mode)
docker-compose down # Stop and delete containers
docker-compose restart # Restart the containers
docker-compose stop # Stop without deleting containers
docker-compose pause # Temporarily suspend Containers
docker-compose unpause # Resume suspended containers
```
---

Now you that you started the docker containers you can access to your local webserver to perform the tests

Or you can do the test on CLI :

### ** Testing API Requests** 
#### **Scan via API**
```
curl -X POST ‘http://localhost:8080/scan/’ \
-H ‘Content-Type: application/json’ \
-d ‘{’target‘: “https://www.exemple.fr/”}’
```

#### **Recover Scan Results**
```
curl -X GET ‘http://localhost:8080/results/<task_id>’
```
