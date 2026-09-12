from __future__ import annotations

import json
import logging
import re
import urllib.parse
import urllib.request

from app.core.config import get_settings
from app.services.ai_analyzer import get_openai_client

logger = logging.getLogger(__name__)


def parse_github_url(url: str) -> tuple[str, str]:
    """Extract owner and repo name from a GitHub URL."""
    clean_url = url.strip()
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = "https://" + clean_url
    
    parsed = urllib.parse.urlparse(clean_url)
    path_parts = [p for p in parsed.path.strip("/").split("/") if p]
    
    if len(path_parts) < 2:
        raise ValueError("Invalid GitHub URL. Must be in format: https://github.com/owner/repository")
    
    owner = path_parts[0]
    repo = path_parts[1].replace(".git", "")
    return owner, repo


def fetch_github_repo_data(url: str) -> dict:
    """Fetch public repository metadata and README excerpt from GitHub REST API."""
    owner, repo = parse_github_url(url)
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HireLens-Analyzer/1.0",
        "Accept": "application/vnd.github.v3+json",
    }
    
    api_url = f"https://api.github.com/repos/{owner}/{repo}"
    req = urllib.request.Request(api_url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            repo_info = json.loads(response.read().decode("utf-8"))
    except Exception as err:
        logger.warning(f"GitHub API fetch failed for {owner}/{repo}: {err}")
        # Return fallback structured dict if rate limited or unaccessible
        repo_info = {
            "name": repo.replace("-", " ").replace("_", " ").title(),
            "description": f"Open source software project hosted at {owner}/{repo}.",
            "language": "JavaScript/Python",
            "stargazers_count": 0,
            "topics": [],
        }

    # Attempt to fetch README.md text content
    readme_text = ""
    for branch in ["main", "master"]:
        readme_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md"
        try:
            r_req = urllib.request.Request(readme_url, headers=headers)
            with urllib.request.urlopen(r_req, timeout=4) as r_resp:
                raw_readme = r_resp.read().decode("utf-8", errors="ignore")
                # Clean markdown tags
                clean_readme = re.sub(r"```[\s\S]*?```", "", raw_readme)
                clean_readme = re.sub(r"<[^>]+>", " ", clean_readme)
                clean_readme = re.sub(r"\s+", " ", clean_readme)
                readme_text = clean_readme[:1500]
                break
        except Exception:
            continue

    return {
        "owner": owner,
        "repo": repo,
        "name": repo_info.get("name", repo).replace("-", " ").replace("_", " ").title(),
        "description": repo_info.get("description") or f"Web application developed by {owner}.",
        "language": repo_info.get("language") or "Python / TypeScript",
        "stars": repo_info.get("stargazers_count", 0),
        "topics": repo_info.get("topics", []),
        "readme_excerpt": readme_text or repo_info.get("description") or "",
        "url": f"https://github.com/{owner}/{repo}",
    }


def generate_github_project_summary(github_url: str) -> dict:
    """Generate ATS-ready project bullet points and tech stack tags from a GitHub URL."""
    data = fetch_github_repo_data(github_url)
    
    project_title = data["name"]
    primary_lang = data["language"]
    topics = data["topics"]
    desc = data["description"]
    readme = data["readme_excerpt"]
    
    # Try using OpenAI structured generation if API key is configured
    settings = get_settings()
    client = get_openai_client()
    
    if client and settings.openai_api_key:
        try:
            prompt = f"""
            You are a professional resume writer for top tech candidates.
            Analyze the following GitHub repository metadata and generate high-impact, ATS-optimized project key points for a resume.

            Repository Title: {project_title}
            Primary Language: {primary_lang}
            Topics/Tags: {", ".join(topics)}
            Description: {desc}
            README Excerpt: {readme}

            Respond in JSON format:
            {{
                "title": "{project_title}",
                "tech_stack": ["Tag1", "Tag2", "Tag3"],
                "key_points": [
                    "Action-verb bullet point 1 with technical implementation details",
                    "Action-verb bullet point 2 emphasizing architecture or data flow",
                    "Action-verb bullet point 3 highlighting performance, scalability, or user benefit"
                ]
            }}
            """
            
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "You convert technical project repos into polished ATS resume bullet points."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            parsed = json.loads(response.choices[0].message.content)
            return {
                "title": parsed.get("title", project_title),
                "tech_stack": parsed.get("tech_stack", [primary_lang] + topics[:4]),
                "key_points": parsed.get("key_points", []),
                "url": data["url"],
                "stars": data["stars"],
            }
        except Exception as e:
            logger.warning(f"OpenAI project summary failed: {e}. Falling back to deterministic generator.")

    # Rule-based deterministic fallback generator
    tech_tags = [primary_lang] if primary_lang else []
    for t in topics:
        if t.capitalize() not in tech_tags:
            tech_tags.append(t.capitalize())
    if not tech_tags:
        tech_tags = ["Python", "JavaScript", "REST API", "Git"]

    bullet_1 = f"Designed and built **{project_title}**, an end-to-end software solution leveraging {', '.join(tech_tags[:3])}."
    bullet_2 = f"Implemented core business logic, modular data models, and high-performance API endpoints based on modern architectural patterns."
    bullet_3 = f"Maintained clean code quality, automated test coverage, and documentation for seamless open-source collaboration."

    if desc and len(desc) > 15:
        bullet_1 = f"Architected **{project_title}**: {desc.rstrip('.')} utilizing {', '.join(tech_tags[:3])}."

    return {
        "title": project_title,
        "tech_stack": tech_tags[:6],
        "key_points": [bullet_1, bullet_2, bullet_3],
        "url": data["url"],
        "stars": data["stars"],
    }
