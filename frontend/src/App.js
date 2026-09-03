import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Deck from "./components/Deck";
import Presenter from "./components/Presenter";
import PrintView from "./components/PrintView";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Deck />} />
        <Route path="/apresentador" element={<Presenter />} />
        <Route path="/imprimir" element={<PrintView />} />
      </Routes>
    </BrowserRouter>
  );
}
