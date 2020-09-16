import React from "react";
import { v1 as uuid } from "uuid";

const CreateRoom = (props) => {
    function create() {
        const id = uuid();
        props.history.push(`/room/${id}`);
    }

    return (
        <div className="createRoomContainer">
            <div>
                <h2>React Video Calling App</h2>
                <h6>By Nikhil Kadyan</h6>
                <button onClick={create}>Create room</button>
            </div>
        </div>
    );
};

export default CreateRoom;
