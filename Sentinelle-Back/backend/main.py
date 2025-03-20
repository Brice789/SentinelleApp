from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from pydantic import BaseModel, validator
from utils import run_nmap, run_nuclei, run_nikto, run_command
import re

app = FastAPI()

# CORS pour permettre les requêtes du frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Spécifiquement pour votre frontend React
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Stockage en mémoire des tâches
tasks = {}

# Schéma de validation avec regex pour les URL
class ScanRequest(BaseModel):
    target: str
   
    @validator('target')
    def validate_target(cls, v):
        # Validation simple pour les URLs ou domaines
        if not re.match(r'^(http(s)?://)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$', v):
            raise ValueError('Cible invalide. Veuillez entrer une URL ou un nom de domaine valide.')
        return v

# Schéma pour les commandes personnalisées
class CommandRequest(BaseModel):
    tool: str  # Le conteneur Docker à utiliser (nmap, nuclei, nikto)
    command: str  # Les arguments de la commande
    
    @validator('tool')
    def validate_tool(cls, v):
        allowed_tools = ['nmap', 'nuclei', 'nikto']
        if v not in allowed_tools:
            raise ValueError(f'Outil non autorisé. Choisissez parmi: {", ".join(allowed_tools)}')
        return v
    
    @validator('command')
    def validate_command(cls, v):
        # Liste des commandes ou caractères interdits pour la sécurité
        forbidden = ['rm', ';', '&&', '||', '>', '<', '`', '$', '|', 'sudo']
        for item in forbidden:
            if item in v:
                raise ValueError('Commande non autorisée pour des raisons de sécurité')
        return v

@app.post("/scan/")
def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """
    Démarre un processus de scan pour une cible donnée.
    """
    target = request.target
   
    # Assurez-vous que l'URL commence par http:// ou https://
    if not target.startswith(('http://', 'https://')):
        target = f"http://{target}"
   
    task_id = str(uuid4())
   
    # Stocke le statut initial
    tasks[task_id] = {"status": "pending", "result": None}
   
    # Ajoute le scan aux tâches en arrière-plan
    background_tasks.add_task(run_scan, task_id, target)
   
    return {"task_id": task_id, "status": "started"}

@app.post("/command/")
def execute_command(request: CommandRequest, background_tasks: BackgroundTasks):
    """
    Exécute une commande spécifique dans un conteneur Docker.
    """
    tool = request.tool
    command = request.command
    
    task_id = str(uuid4())
    
    # Stocke le statut initial
    tasks[task_id] = {"status": "pending", "result": None}
    
    # Ajoute l'exécution de la commande aux tâches en arrière-plan
    background_tasks.add_task(process_command, task_id, tool, command)
    
    return {"task_id": task_id, "status": "started"}

def process_command(task_id: str, tool: str, command: str):
    """
    Traite une commande spécifique et stocke les résultats.
    """
    try:
        # Exécute la commande dans le conteneur approprié
        result = run_command(f"{tool}_worker", command)
        
        # Stocke les résultats
        tasks[task_id] = {
            "status": "completed",
            "result": result
        }
    except Exception as e:
        # Gère les erreurs pendant l'exécution
        tasks[task_id] = {"status": "error", "error": str(e)}

def run_scan(task_id: str, target: str):
    """
    Orchestre les scans Nmap, Nuclei et Nikto.
    """
    try:
        # Ces fonctions exécuteront les conteneurs Docker
        nmap_result = run_nmap(target)
        nuclei_result = run_nuclei(target)
        nikto_result = run_nikto(target)
       
        # Agrège les résultats
        tasks[task_id] = {
            "status": "completed",
            "result": {
                "nmap": nmap_result,
                "nuclei": nuclei_result,
                "nikto": nikto_result
            }
        }
    except Exception as e:
        # Gère les erreurs pendant les scans
        tasks[task_id] = {"status": "error", "error": str(e)}

@app.get("/results/{task_id}")
def get_results(task_id: str):
    """
    Récupère les résultats d'un scan par ID de tâche.
    """
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    return task

@app.get("/")
def root():
    """
    Endpoint par défaut pour vérifier si l'API fonctionne.
    """
    return {"message": "API de Pentest est en cours d'exécution"}