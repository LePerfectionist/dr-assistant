from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlmodel import Session, select
import networkx as nx
from pyvis.network import Network
import os

from app.database import get_session
from app.models.application import Application
from app.models.system import System
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/analysis", tags=["Analysis"])
VIS_OUTPUT_DIR = "app/static/visualizations"

@router.get("/{application_id}/dependency_graph", response_class=HTMLResponse)
def get_dependency_graph(
    application_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Generates an interactive HTML dependency graph for a given application.
    """
    application = session.get(Application, application_id)
    if not application or application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Application not found or access denied.")
    
    systems = application.systems
    if not systems:
        return "<html><body>No systems found for this application to generate a graph.</body></html>"

    # 1. Create a directed graph using networkx
    G = nx.DiGraph()

    # 2. Add all systems as nodes
    for system in systems:
        G.add_node(system.name, title=f"Approved: {system.is_approved}", color="skyblue" if system.is_approved else "orangered")

    # 3. Add edges based on dependencies
    for system in systems:
        for dep in system.upstream_dependencies:
            # Edge direction: Dependency -> System
            G.add_edge(dep, system.name, title="upstream dependency")
        for dep in system.downstream_dependencies:
            # Edge direction: System -> Dependency
            G.add_edge(system.name, dep, title="downstream dependency")

    # 4. Create an interactive visualization with pyvis
    net = Network(height="800px", width="100%", notebook=True, directed=True)
    net.from_nx(G)
    
    # Customize physics for a better layout
    net.set_options("""
    var options = {
      "physics": {
        "hierarchicalRepulsion": {
          "centralGravity": 0.0,
          "springLength": 200,
          "springConstant": 0.01,
          "nodeDistance": 200,
          "damping": 0.2
        },
        "minVelocity": 0.75,
        "solver": "hierarchicalRepulsion"
      }
    }
    """)

    # 5. Save the graph to an HTML file and return it
    os.makedirs(VIS_OUTPUT_DIR, exist_ok=True)
    graph_path = os.path.join(VIS_OUTPUT_DIR, f"app_{application_id}_graph.html")
    net.save_graph(graph_path)

    with open(graph_path, "r") as f:
        html_content = f.read()
    
    return HTMLResponse(content=html_content)