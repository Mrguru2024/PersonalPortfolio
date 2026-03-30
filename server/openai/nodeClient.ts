/**
 * Single Node entry for the OpenAI SDK. Webpack can evaluate dependency modules before a route’s
 * side-effect imports run; importing the SDK only from here guarantees `openai/shims/node` runs first.
 */
import "openai/shims/node";
import OpenAI from "openai";

export default OpenAI;
export { OpenAI };
