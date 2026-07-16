export {};
declare global {
    declare module "*.jsx";
    declare module "*.css";
  interface Window {
    getAIAssistBtnPosition?: () => {
      x: number;
      y: number;
    };

    getAIChatBtnPosition?: () => {
      x: number;
      y: number;
    };

    setAiAssistBtnPosition?: (x: number, y: number) => void;

    setAiAssistBtnIconSize?: (
      width: number,
      height: number
    ) => void;

    getAIAssistPopupPosition?: () => {
      x: number;
      y: number;
    };

    getAIButtonPosition?: () => {
      x: number;
      y: number;
    };

    getGeneratingDraftPosition?: () => {
      x: number;
      y: number;
    };

    setGeneratingDraftPosition?: (
      x: number,
      y: number
    ) => void;

    toggleSendIcon?: (enabled: boolean) => void;
  }
}