import type { Translation } from "../../translate";
import type en from "../en/changelog";

const messages: Translation<typeof en> = {
  title: "Registro de cambios",
  intro:
    "Todas las versiones de mempoolxch.space, generadas a partir de las etiquetas y los mensajes de commit del repositorio. Las notas de versión publicadas están en <releases>GitHub</releases>, y el historial completo de commits <commits>también</commits>.",
  unreleased: "Sin publicar",
  untagged: "en la rama, aún sin etiquetar",
  running: "en uso",
  compareOnGitHub: "comparar en GitHub",
  releaseNotes: "notas de versión",
  compare: "comparar",
  footer:
    "Generado el {date}. Vuelve a generarlo con <code>bun run changelog</code> después de etiquetar.",
};

export default messages;
