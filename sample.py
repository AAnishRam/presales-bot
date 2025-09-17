import streamlit as st
import requests
import json
from typing import List, Dict
 
# Page configuration - MUST be first
st.set_page_config(
    page_title="Sales enablement Bot",
    layout="wide",
    initial_sidebar_state="collapsed",
)
 
# --- Chat Session Management ---
def get_session_name(messages):
    for msg in messages:
        if msg["role"] == "user":
            return msg["content"][:40] + ("..." if len(msg["content"]) > 40 else "")
    return "New Chat"
 
if "chat_sessions" not in st.session_state:
    st.session_state.chat_sessions = []
if "current_session" not in st.session_state:
    st.session_state.current_session = {
        "name": "New Chat",
        "messages": [
            {
                "role": "assistant",
                "content": "Hello! I'm your Sales enablement Bot. I help convert customer requirements into AI/ML solution architectures. What's your customer's requirement?"
            }
        ]
    }
 
def add_current_session_to_history():
    if any(m["role"] == "user" for m in st.session_state.current_session["messages"]):
        st.session_state.current_session["name"] = get_session_name(st.session_state.current_session["messages"])
        if not any(sess["messages"] == st.session_state.current_session["messages"] for sess in st.session_state.chat_sessions):
            st.session_state.chat_sessions.append({
                "name": st.session_state.current_session["name"],
                "messages": list(st.session_state.current_session["messages"])
            })
 
# Sidebar: Chat session history and new chat button
with st.sidebar:
    st.title("Chat History")
    current_name = get_session_name(st.session_state.current_session["messages"])
    st.markdown(f"**{current_name}**")
   
    if st.button("➕ New Chat"):
        add_current_session_to_history()
        st.session_state.current_session = {
            "name": "New Chat",
            "messages": [
                {
                    "role": "assistant",
                    "content": "Hello! I'm your Sales enablement Bot. I help convert customer requirements into AI/ML solution architectures. What's your customer's requirement?"
                }
            ]
        }
        st.rerun()
   
    if st.session_state.chat_sessions:
        for idx, sess in enumerate(st.session_state.chat_sessions):
            if sess["messages"] == st.session_state.current_session["messages"]:
                continue
            if st.button(sess["name"], key=f"history_{idx}"):
                add_current_session_to_history()
                st.session_state.current_session = {
                    "name": sess["name"],
                    "messages": list(sess["messages"])
                }
                st.rerun()
    else:
        st.info("No previous chats yet.")
 
# Custom CSS for SaleBot branding
st.markdown("""
<style>
    .stDeployButton {display: none;}
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    .css-1d391kg {display: none;}
    .st-emotion-cache-1d391kg {display: none;}
    .css-1rs6os {display: none;}
    .st-emotion-cache-1rs6os {display: none;}
    .css-17eq0hr {display: none;}
    .main-header {
        background: linear-gradient(135deg, #FF9900 0%, #232F3E 100%);
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        margin-bottom: 2rem;
        color: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .company-title {
        font-size: 1.5rem;
        font-weight: bold;
        margin: 0;
    }
    .company-subtitle {
        font-size: 0.9rem;
        opacity: 0.9;
        margin: 0.25rem 0 0 0;
    }
    .stChatMessage[data-testid="chat-message-user"] {
        background: #FFF3E0;
        color: #E65100;
        border-radius: 1rem;
        padding: 0.75rem;
        margin: 0.5rem 0;
    }
    .stChatMessage[data-testid="chat-message-assistant"] {
        background: #F5F7FA;
        border: 1px solid #FF9900;
        border-radius: 1rem;
        padding: 0.75rem;
        margin: 0.5rem 0;
        color: #232F3E;
    }
    .dynamic-prompt-container {
        border-top: 1px solid #e2e8f0;
        padding-top: 1.5rem;
        margin-top: 1.5rem;
    }
    .dynamic-prompt-title {
        color: #232F3E;
        font-weight: 600;
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
    }
</style>
""", unsafe_allow_html=True)
 
# API Configuration
CHAT_API_ENDPOINT = "http://13.220.115.202:8000/app/api/v1/conversation/chat"
 
def send_message_to_api(messages: List[Dict], query: str) -> Dict:
    try:
        history = []
        for msg in messages:
            if msg["role"] == "user":
                history.append({"role": "user", "content": msg["content"]})
            elif msg["role"] == "assistant":
                content = msg.get("content", "")
                history.append({"role": "assistant", "content": content})
        payload = {
            "history": history,
            "query": query
        }
        response = requests.post(
            CHAT_API_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=600  # Increased from 300 to 600 seconds (10 minutes)
        )
        if response.status_code == 200:
            try:
                result = response.json()
               
                # DEBUG: Print the actual API response
                print("=== DEBUG API RESPONSE ===")
                print(f"Full response: {json.dumps(result, indent=2)}")
                print("========================")
               
                return {
                    "answer": result.get("answer", "I apologize, but I didn't receive a proper response."),
                    "visualization_url": result.get("visualization_url"),
                    "architecture_url": result.get("architecture_url"),
                    "flowchart_url": result.get("flowchart_url"),
                    "has_architecture": result.get("has_architecture", False),
                    "has_flowchart": result.get("has_flowchart", False),
                    "has_both_diagrams": result.get("has_both_diagrams", False)
                }
            except ValueError as e:
                return {
                    "answer": f"Error: Invalid JSON response from server. {str(e)}",
                    "visualization_url": None,
                    "architecture_url": None,
                    "flowchart_url": None,
                    "has_architecture": False,
                    "has_flowchart": False,
                    "has_both_diagrams": False
                }
        else:
            return {
                "answer": f"Error: Unable to connect to the server (Status: {response.status_code})\nResponse: {response.text}",
                "visualization_url": None,
                "architecture_url": None,
                "flowchart_url": None,
                "has_architecture": False,
                "has_flowchart": False,
                "has_both_diagrams": False
            }
    except requests.exceptions.RequestException as e:
        return {
            "answer": f"Connection Error: {e}",
            "visualization_url": None,
            "architecture_url": None,
            "flowchart_url": None,
            "has_architecture": False,
            "has_flowchart": False,
            "has_both_diagrams": False
        }
    except Exception as e:
        return {
            "answer": f"An unexpected error occurred: {str(e)}",
            "visualization_url": None,
            "architecture_url": None,
            "flowchart_url": None,
            "has_architecture": False,
            "has_flowchart": False,
            "has_both_diagrams": False
        }
 
def display_visualizations(message_data):
    """Display visualizations based on available diagram types"""
    base_url = "http://13.220.115.202:8000"
    # base_url = ""
   
    # DEBUG: Print what we received
    print("=== DEBUG VISUALIZATION DATA ===")
    print(f"has_both_diagrams: {message_data.get('has_both_diagrams')}")
    print(f"has_architecture: {message_data.get('has_architecture')}")
    print(f"has_flowchart: {message_data.get('has_flowchart')}")
    print(f"architecture_url: {message_data.get('architecture_url')}")
    print(f"flowchart_url: {message_data.get('flowchart_url')}")
    print(f"visualization_url: {message_data.get('visualization_url')}")
    print("==============================")
   
    # Check for multiple diagrams
    if message_data.get("has_both_diagrams"):
        st.subheader("📊 Visual Documentation")
       
        # Create two columns for side-by-side display
        col1, col2 = st.columns(2)
       
        with col1:
            st.markdown("**🏗️ AWS Architecture Diagram**")
            if message_data.get("architecture_url"):
                arch_url = f"{base_url}{message_data['architecture_url']}"
                print(f"Displaying architecture: {arch_url}")
                st.image(arch_url, use_container_width=True)
            else:
                st.warning("Architecture diagram URL not available")
       
        with col2:
            st.markdown("**📊 Process Flowchart**")
            if message_data.get("flowchart_url"):
                flow_url = f"{base_url}{message_data['flowchart_url']}"
                print(f"Displaying flowchart: {flow_url}")
                st.image(flow_url, use_container_width=True)
            else:
                st.warning("Flowchart diagram URL not available")
               
    elif message_data.get("has_architecture"):
        st.subheader("🏗️ AWS Architecture Diagram")
        if message_data.get("architecture_url"):
            arch_url = f"{base_url}{message_data['architecture_url']}"
            st.image(arch_url, use_container_width=True)
           
    elif message_data.get("has_flowchart"):
        st.subheader("📊 Process Flowchart")
        if message_data.get("flowchart_url"):
            flow_url = f"{base_url}{message_data['flowchart_url']}"
            st.image(flow_url, use_container_width=True)
           
    elif message_data.get("visualization_url"):
        # Fallback for backward compatibility
        st.subheader("📊 Visualization")
        full_url = f"{base_url}{message_data['visualization_url']}"
        st.image(full_url, use_container_width=True)
    else:
        print("No visualizations to display")
 
# Header
st.markdown("""
    <div class="main-header">
        <h1 class="company-title">Sales enablement Bot</h1>
        <p class="company-subtitle">AI/ML Solution Architecture & Feasibility Assistant</p>
    </div>
    """, unsafe_allow_html=True)
 
# Main chat interface
for message in st.session_state.current_session["messages"]:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if message.get("role") == "assistant":
            display_visualizations(message)
 
# Chat input with sales assist placeholder
if prompt := st.chat_input("Describe your customer's AI/ML requirement in one line..."):
    # Add user message to state and display it
    st.session_state.current_session["messages"].append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
   
    # Generate and display assistant response
    with st.chat_message("assistant"):
        with st.spinner("Analyzing requirement and generating solution architecture..."):
            api_history = st.session_state.current_session["messages"][:-1]
            api_response = send_message_to_api(api_history, prompt)
           
            # Display the answer
            st.markdown(api_response["answer"])
           
            # Display visualizations using the new function
            display_visualizations(api_response)
           
            # Store the response in the session with all visualization data
            assistant_msg = {
                "role": "assistant",
                "content": api_response["answer"],
                "visualization_url": api_response.get("visualization_url"),
                "architecture_url": api_response.get("architecture_url"),
                "flowchart_url": api_response.get("flowchart_url"),
                "has_architecture": api_response.get("has_architecture", False),
                "has_flowchart": api_response.get("has_flowchart", False),
                "has_both_diagrams": api_response.get("has_both_diagrams", False)
            }
            st.session_state.current_session["messages"].append(assistant_msg)
 