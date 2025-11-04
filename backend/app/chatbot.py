import os
from typing import Dict, Any
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph

# Load environment variables
load_dotenv()


class ChatbotService:
    def __init__(self, system_prompt: str):
        self.allowed_models = {"gpt-4o-mini", "gpt-5"}
        self.model_name = os.getenv("DA_OPENAI_MODEL", "gpt-4o-mini")
        if self.model_name not in self.allowed_models:
            self.model_name = "gpt-4o-mini"

        self.model = ChatOpenAI(
            model=self.model_name,
            openai_api_key=os.getenv("DA_OPENAI_API_KEY"),
            openai_api_base="https://doubleagents.openai.azure.com/openai/v1",
            temperature=1.0,
        )

        self.workflow = StateGraph(state_schema=MessagesState)
        self.workflow.add_edge(START, "model")
        self.workflow.add_node("model", self._call_model)

        # Add memory
        self.memory = MemorySaver()
        self.app = self.workflow.compile(checkpointer=self.memory)

        self.default_system_prompt = system_prompt
        self.current_system_prompt = system_prompt
        self.set_system_prompt(system_prompt)

    def _call_model(self, state: MessagesState):
        prompt = self.prompt_template.invoke(state)
        response = self.model.invoke(prompt)

        try:
            actual_model = response.response_metadata.get("model_name", "unknown")
            print(f"[ChatbotService] ✅ Actual model that responded: {actual_model}")
        except Exception:
            print("[ChatbotService] ⚠️ Could not extract actual model from response")

        return {"messages": response}

    def set_system_prompt(self, system_prompt: str):
        self.current_system_prompt = system_prompt
        self.prompt_template = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

    def set_model(self, model_name: str):
        if model_name not in self.allowed_models:
            raise ValueError(f"Unsupported model: {model_name}")
        if model_name != self.model_name:
            self.model_name = model_name
            self.model = ChatOpenAI(
                model=self.model_name,
                openai_api_key=os.getenv("DA_OPENAI_API_KEY"),
                openai_api_base="https://doubleagents.openai.azure.com/openai/v1",
                temperature=1.0,
            )

    def chat(
        self,
        message: str,
        thread_id: str = "default",
        system_prompt: str = None,
        model: str = None,
    ) -> str:
        if model:
            self.set_model(model)
        try:
            if system_prompt and system_prompt.strip():
                self.set_system_prompt(system_prompt)

            config = {"configurable": {"thread_id": thread_id}}
            input_messages = [HumanMessage(content=message)]

            output = self.app.invoke({"messages": input_messages}, config)
            ai_response = output["messages"][-1]

            return ai_response.content

        except Exception as e:
            return f"Error: {str(e)}"

    async def stream_chat(
        self, message: str, thread_id: str = "default", model: str = None
    ):
        if model:
            self.set_model(model)
        try:
            config = {"configurable": {"thread_id": thread_id}}
            input_messages = [HumanMessage(content=message)]

            async for chunk, metadata in self.app.astream(
                {"messages": input_messages}, config, stream_mode="messages"
            ):
                if isinstance(chunk, AIMessage):
                    yield chunk.content

        except Exception as e:
            yield f"Error: {str(e)}"
