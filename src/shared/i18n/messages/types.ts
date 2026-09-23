import type { Translation } from "../translate";
import type en from "./en";

/** The English messages define the shape; every other locale must translate all of it. */
export type EnglishMessages = typeof en;
export type Messages = Translation<EnglishMessages>;
export type Namespace = keyof EnglishMessages;
