import React, { useState } from "react";
import ReutilizarUrbano from "./ReutilizarUrbano";
import ReutilizarInterprovincial from "./ReutilizarInterprovincial";

const ReutilizarBilhete = () => {
    const [tipo, setTipo] = useState("urbano");

    return (
        <div>
            <h2>Reutilizar Bilhete</h2>
            <button onClick={() => setTipo("urbano")}>Urbano</button>
            <button onClick={() => setTipo("interprovincial")}>Interprovincial</button>

            <hr />

            {tipo === "urbano" && <ReutilizarUrbano />}
            {tipo === "interprovincial" && <ReutilizarInterprovincial />}
        </div>
    );
};

export default ReutilizarBilhete;
