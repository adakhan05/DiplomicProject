import os
import sys
import subprocess
from pathlib import Path

def run_daphne():
    print("Запуск Daphne ASGI сервера...")
    
    base_dir = Path(__file__).resolve().parent
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jobsearch.settings')
    
    cmd = [
        sys.executable, "-m", "daphne",
        "-b", "0.0.0.0", 
        "-p", "8000",     
        "jobsearch.asgi:application"
    ]
    
    print(f"Запуск команды: {' '.join(cmd)}")
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\nDaphne сервер остановлен.")
    except subprocess.CalledProcessError as e:
        print(f"Ошибка запуска Daphne: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_daphne() 