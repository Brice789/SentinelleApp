import subprocess
import json
import os
import tempfile
import re

def run_docker_command(image, command):
    """
    Exécute une commande dans un conteneur Docker
    """
    cmd = f"docker run --rm {image} {command}"
    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    
    if process.returncode != 0:
        raise Exception(f"Erreur lors de l'exécution de la commande Docker: {stderr.decode()}")
    
    return stdout.decode()

def run_command(image, command):
    """
    Exécute une commande générique dans un conteneur Docker et retourne le résultat au format JSON
    """
    try:
        # Sanitize la commande pour éviter les injections
        command = re.sub(r'[;&|<>$()]', '', command)
        
        # Exécute la commande
        result = run_docker_command(image, command)
        
        # Tente de parser en JSON si possible
        try:
            if result.strip().startswith('{') or result.strip().startswith('['):
                return json.loads(result)
        except json.JSONDecodeError:
            pass
        
        # Format de réponse par défaut si ce n'est pas du JSON valide
        return {
            "output": result,
            "raw": result.split('\n'),
            "command": command
        }
    except Exception as e:
        return {"error": str(e)}

def run_nmap(target):
    """
    Exécute un scan Nmap sur la cible
    """
    try:
        # Commande Nmap de base avec détection de version
        command = f"-sV -p 1-1000 {target}"
        result = run_docker_command("nmap_worker", command)
        
        # Parsez le résultat si nécessaire
        parsed_result = {
            "raw": result,
            "ports": parse_nmap_output(result)
        }
        
        return parsed_result
    except Exception as e:
        return {"error": str(e)}

def parse_nmap_output(output):
    """
    Parse la sortie Nmap pour extraire les informations des ports
    """
    ports = []
    lines = output.split('\n')
    
    for line in lines:
        if '/tcp' in line or '/udp' in line:
            parts = line.split()
            if len(parts) >= 3:
                port_info = {
                    "port": parts[0],
                    "state": parts[1],
                    "service": ' '.join(parts[2:])
                }
                ports.append(port_info)
    
    return ports

def run_nuclei(target):
    """
    Exécute un scan Nuclei sur la cible
    """
    try:
        # Options Nuclei de base
        command = f"-u {target} -silent -json"
        result = run_docker_command("nuclei_worker", command)
        
        # Parsez le résultat JSON
        findings = []
        for line in result.strip().split('\n'):
            if line:
                try:
                    finding = json.loads(line)
                    findings.append(finding)
                except json.JSONDecodeError:
                    pass
        
        return {
            "findings": findings,
            "count": len(findings)
        }
    except Exception as e:
        return {"error": str(e)}

def run_nikto(target):
    """
    Exécute un scan Nikto sur la cible
    """
    try:
        # Commande Nikto de base avec sortie JSON
        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as temp:
            temp_file = temp.name
        
        command = f"-h {target} -Format json -o {temp_file}"
        run_docker_command("nikto_worker", command)
        
        # Lire le fichier JSON
        with open(temp_file, 'r') as f:
            result = json.load(f)
        
        # Nettoyer le fichier temporaire
        os.unlink(temp_file)
        
        return result
    except Exception as e:
        return {"error": str(e)}