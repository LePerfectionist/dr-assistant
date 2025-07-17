from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlmodel import Session, select
import networkx as nx
from networkx.algorithms.centrality import in_degree_centrality
from networkx.algorithms import out_degree_centrality
from pyvis.network import Network
import os
import math

from app.database import get_session
from app.models.application import Application
from app.models.system import System
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/analysis", tags=["Analysis"])
VIS_OUTPUT_DIR = "app/visualisations"


@router.get("/{application_id}/dependency_graph", response_class=HTMLResponse)
def get_dependency_graph(
    application_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Generates an advanced, interactive dependency graph using network theory.
    """
    application = session.get(Application, application_id)
    if not application or application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Application not found or access denied.")
    
    systems = application.systems
    if not systems:
        return "<html><body>No systems found for this application.</body></html>"

    G = nx.DiGraph()
    
    all_node_names = set()
    system_map = {}
    for system in systems:
        all_node_names.add(system.name)
        system_map[system.name] = system
        for dep in system.upstream_dependencies:
            all_node_names.add(dep)
        for dep in system.downstream_dependencies:
            all_node_names.add(dep)

    for name in all_node_names:
        system_obj = system_map.get(name)
        if system_obj:
            is_approved = system_obj.is_approved
            title = f"System: {name}\nStatus: {'Approved' if is_approved else 'Not Approved'}"
            G.add_node(name, title=title, is_approved=is_approved)
        else:
            # This is an external dependency (e.g., "Firewall")
            # It has no approval status of its own in our system
            is_approved = None
            title = f"External Dependency: {name}"
            G.add_node(name, title=title, is_approved=is_approved)
            
    for system in systems:
        for dep in system.upstream_dependencies:
            G.add_edge(dep, system.name)
        for dep in system.downstream_dependencies:
            G.add_edge(system.name, dep)

    in_degree = in_degree_centrality(G)
    out_degree = out_degree_centrality(G)
    betweenness = nx.betweenness_centrality(G, normalized=True)

    net = Network(height="900px", width="100%", notebook=True, directed=True, bgcolor="#222222", font_color="white")
    # net = Network(
    #     height="900px", 
    #     width="100%", 
    #     notebook=True, 
    #     directed=True, 
    #     bgcolor="#222222", 
    #     font_color="white",
    #     cdn_resources='in_line'
    # )
    
    for node in G.nodes(data=True):
        node_name = node[0]
        node_attrs = node[1]

        degree_centrality = in_degree.get(node_name, 0) + out_degree.get(node_name, 0)
        node_size = 15 + (degree_centrality * 100)
        
        # Color logic now handles the three states: Approved, Not Approved, or External
        node_is_approved = node_attrs.get('is_approved')
        if node_is_approved is True:
            color = "skyblue"
        elif node_is_approved is False:
            color = "orangered"
        else: # is_approved is None for external dependencies
            color = "grey"

        if betweenness.get(node_name, 0) > 0.0: # Check against a threshold for normalized value
            if color == "skyblue": color = "#97c2fc"
            elif color == "orangered": color = "#ff7f50"
            else: color = "#a9a9a9"
        
        net.add_node(node_name, label=node_name, title=node_attrs['title'], size=node_size, color=color)

    net.add_edges(G.edges())

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

    os.makedirs(VIS_OUTPUT_DIR, exist_ok=True)
    graph_path = os.path.join(VIS_OUTPUT_DIR, f"app_{application_id}_graph.html")
    net.save_graph(graph_path)
    
    with open(graph_path, "r") as f:
        html_content = f.read()
    
    return HTMLResponse(content=html_content)