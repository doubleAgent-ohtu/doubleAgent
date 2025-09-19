import os
from typing import Dict, Any
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph

# Load environment variables
load_dotenv()

class ChatbotService:
    def __init__(self):
        # Initialize Azure OpenAI model
        self.model = AzureChatOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4"),
            openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            temperature=0.7
        )
        
        # Simple prompt
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful assistant. Answer questions clearly."),
            MessagesPlaceholder(variable_name="messages"),
        ])
        
        self.workflow = StateGraph(state_schema=MessagesState)
        self.workflow.add_edge(START, "model")
        self.workflow.add_node("model", self._call_model)
        
        # Add memory
        self.memory = MemorySaver()
        self.app = self.workflow.compile(checkpointer=self.memory)
    
    def _call_model(self, state: MessagesState):
        prompt = self.prompt_template.invoke(state)
        response = self.model.invoke(prompt)
        return {"messages": response}
    
    def chat(self, message: str, thread_id: str = "default") -> str:

        try:
            config = {"configurable": {"thread_id": thread_id}}
            input_messages = [HumanMessage(content=message)]
            
            output = self.app.invoke({"messages": input_messages}, config)
            ai_response = output["messages"][-1]
            
            return ai_response.content
            
        except Exception as e:
            return f"Error: {str(e)}"
    
    async def stream_chat(self, message: str, thread_id: str = "default"):

        try:
            config = {"configurable": {"thread_id": thread_id}}
            input_messages = [HumanMessage(content=message)]
            
            async for chunk, metadata in self.app.astream(
                {"messages": input_messages}, 
                config, 
                stream_mode="messages"
            ):
                if isinstance(chunk, AIMessage):
                    yield chunk.content
                    
        except Exception as e:
            yield f"Error: {str(e)}"