from __future__ import annotations

import re
import socket
from pathlib import Path

ENV_KEY = "EXPO_PUBLIC_API_URL"
SCRIPT_DIR = Path(__file__).resolve().parent
MOBILE_DIR = SCRIPT_DIR.parent
ENV_PATH = MOBILE_DIR / ".env.local"


def get_local_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    finally:
        sock.close()


def update_api_url_ip_only(env_path: Path) -> None:
    if not env_path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {env_path}")

    content = env_path.read_text(encoding="utf-8")
    current_ip = get_local_ip()

    pattern = rf"^({re.escape(ENV_KEY)}=http://)([^:]+)(:\d+)$"

    def replace_line(line: str) -> str:
        match = re.match(pattern, line)
        if not match:
            return line
        prefix, _old_ip, suffix = match.groups()
        return f"{prefix}{current_ip}{suffix}"

    updated_lines = [replace_line(line) for line in content.splitlines()]
    updated_content = "\n".join(updated_lines)

    if content.endswith("\n"):
        updated_content += "\n"

    env_path.write_text(updated_content, encoding="utf-8")

    print(f"IP atualizado para: {current_ip}")
    print(f"Arquivo modificado: {env_path}")


if __name__ == "__main__":
    update_api_url_ip_only(ENV_PATH)