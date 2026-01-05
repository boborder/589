import { render } from "hono/jsx/dom";
import { App } from "./App";

const domNode = document.getElementById("root")!;
render(<App />, domNode);
