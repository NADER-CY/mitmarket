import {createContext,useContext} from 'react';
export const DesktopRuntimeContext=createContext(false);
export const useDesktopRuntime=()=>useContext(DesktopRuntimeContext);
