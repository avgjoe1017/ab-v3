// Import gesture-handler at the very top (required for bna-ui components)
// Must be before any other imports
import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import App from "./src/App";

registerRootComponent(App);
