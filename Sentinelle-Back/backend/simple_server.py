from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Configuration CORS pour accepter les requêtes du frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Votre frontend React
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Liste pour stocker les domaines demandés
domains = []

class DomainRequest(BaseModel):
    domain: str

@app.get("/")
def read_root():
    """Endpoint pour vérifier que le serveur fonctionne"""
    return {"status": "online", "message": "Serveur de test en cours d'exécution"}

@app.get("/domains")
def get_domains():
    """Retourne la liste des domaines demandés"""
    return {"domains": domains}

@app.post("/check-domain")
def check_domain(request: DomainRequest):
    """Simule la vérification d'un domaine"""
    # Ajouter le domaine à la liste
    domains.append(request.domain)
    
    # Simuler une réponse
    return {
        "domain": request.domain,
        "status": "checked",
        "id": len(domains)
    }

@app.get("/domain-status/{domain_id}")
def get_domain_status(domain_id: int):
    """Simule la récupération du statut d'un domaine"""
    if domain_id <= 0 or domain_id > len(domains):
        raise HTTPException(status_code=404, detail="Domaine non trouvé")
    
    # Simuler une réponse avec le statut
    return {
        "domain": domains[domain_id - 1],
        "status": "completed",
        "result": {
            "ports_open": [80, 443],
            "services": ["http", "https"],
            "vulnerabilities": ["Exemple de vulnérabilité"]
        }
    }

if __name__ == "__main__":
    # Lancer le serveur sur le port 8080
    uvicorn.run(app, host="0.0.0.0", port=8080)