from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field, TypeAdapter


class WSChatMessage(BaseModel):
    type: Literal["chat"]
    text: str


class WSNightChatMessage(BaseModel):
    type: Literal["night_chat"]
    text: str


class WSVoteMessage(BaseModel):
    type: Literal["vote"]
    target_id: str


class WSNightActionMessage(BaseModel):
    type: Literal["night_action"]
    action: Literal["kill", "check", "save"]
    target_id: str


class WSStartGameMessage(BaseModel):
    type: Literal["start_game"]


class WSGetStateMessage(BaseModel):
    type: Literal["get_state"]


class WSPingMessage(BaseModel):
    type: Literal["ping"]


IncomingWSMessage = Annotated[
    Union[
        WSChatMessage,
        WSNightChatMessage,
        WSVoteMessage,
        WSNightActionMessage,
        WSStartGameMessage,
        WSGetStateMessage,
        WSPingMessage,
    ],
    Field(discriminator="type"),
]

incoming_ws_message_adapter = TypeAdapter(IncomingWSMessage)


def parse_ws_message(payload: dict) -> IncomingWSMessage:
    return incoming_ws_message_adapter.validate_python(payload)
