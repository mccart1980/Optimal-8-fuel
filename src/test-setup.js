import { installStorage } from "./storage.js";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

installStorage();
afterEach(() => { cleanup(); window.localStorage.clear(); });
