window.getAIAssistBtnPosition = function () {
  var documentEditor = document.getElementById("document-editor") || document.getElementById("container") || document.querySelector(".e-documenteditor-container");
  if (!documentEditor) {
    return;
  }

  var documentEditorRect = documentEditor.getBoundingClientRect();
  var viewerContainer =
    document.querySelector("#document-editor_editor_viewerContainer") ||
    document.querySelector("#container_editor_viewerContainer") ||
    document.querySelector(".e-de-viewer-container");
  if (!viewerContainer) {
    return;
  }

  var cursor = document.querySelector('.e-de-blink-cursor');
  if (!cursor) {
    return;
  }

  var page = cursor.closest('.e-de-page') || document.querySelector('.e-de-page');
  var pageRect = page ? page.getBoundingClientRect() : null;
  var cursorRect = cursor.getBoundingClientRect();
  var rawCursorTop = parseFloat(cursor.style.top || '0');
  var rawCursorLeft = parseFloat(cursor.style.left || '0');

  var caretTop = cursor.style.display === 'none' && !Number.isNaN(rawCursorTop)
    ? viewerContainer.getBoundingClientRect().top + rawCursorTop
    : cursorRect.top;

  var ruler =
    document.querySelector("#document-editor_editor_viewerContainer .e-de-hRuler .e-de-hRuler") ||
    document.querySelector("#container_editor_viewerContainer .e-de-hRuler .e-de-hRuler") ||
    document.querySelector(".e-de-hRuler .e-de-hRuler");

  var pageLeft = pageRect ? pageRect.left : viewerContainer.getBoundingClientRect().left;
  var pageWidth = pageRect ? pageRect.width : 0;
  var rulerLeft = 0;

  if (ruler) {
    var marginLeft = parseFloat(ruler.style.marginLeft || '0');
    rulerLeft = Number.isNaN(marginLeft) ? 0 : marginLeft;
  }

  var caretLeft = cursor.style.display === 'none' && !Number.isNaN(rawCursorLeft)
    ? viewerContainer.getBoundingClientRect().left + rawCursorLeft
    : cursorRect.left;

  var gutterOffset = Math.max(36, Math.min(56, pageWidth ? pageWidth * 0.08 : 40));
  var x = pageLeft - documentEditorRect.left + rulerLeft - gutterOffset;

  if (!Number.isFinite(x) || x < 0) {
    x = caretLeft - documentEditorRect.left - 44;
  }

  var y = caretTop - documentEditorRect.top - 4;

  return {
    x: Math.round(x),
    y: Math.round(y)
  };
};

window.getAIChatBtnPosition = function () {
  var documnetEditor = 
    document.getElementById("document-editor") ||
    document.getElementById("container") ||
    document.querySelector(".e-documenteditor-container");

  if (!documnetEditor) {
    return;
  }
  var documnetEditorRect = documnetEditor.getBoundingClientRect();
  var documnetEditorHeight = documnetEditorRect.height;
  var documnetEditorWidth = documnetEditorRect.width;
  var x = documnetEditorWidth - 87;
  var y = documnetEditorHeight - 81;
  return { x: x, y: y };
};

window.setAiAssistBtnPosition = function (x, y) {
  var el = document.getElementsByClassName('ai-chat-btn')[0];
  if (!el) return;
  el.style.position = 'absolute';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
};
window.getAIAssistPopupPosition = function () {
  var aiButton = document.getElementsByClassName('ai-assist-btn')[0];
  if (!aiButton) return { x: 200, y: 160 };
  var bRect = aiButton.getBoundingClientRect();
  var sampleMargin = 8;
  return { x: bRect.left - sampleMargin, y: (bRect.top + bRect.height) - sampleMargin };
};

window.setDialogDivHeight = (mode) => {
  var q = document.getElementById('e-de-qus-pane');
  var ans = document.getElementById('e-de-editableDiv');
  if (!ans) return;
  if (mode === 'Generate') ans.style.height = '100px';
  else { if (q) q.style.height = '75px'; ans.style.height = '75px'; }
};
window.getTextContent = () => {
  var el = document.getElementById('e-de-editableDiv');
  return el ? (el.textContent || '').trim() : '';
};
window.getInputContent = () => {
  var el = document.getElementById('e-de-editableDiv');
  return el ? (el.value || '').trim() : '';
};
window.getHtmlContent = () => {
  var el = document.getElementById('e-de-editableDiv');
  return el ? el.innerHTML : '';
};
window.setTextContent = (text) => {
  var el = document.getElementById('e-de-editableDiv');
  if (el) el.textContent = text || '';
};
window.setHtmlContent = (html) => {
  var el = document.getElementById('e-de-editableDiv');
  if (el) el.innerHTML = html || '';
};
window.clearDivContent = () => {
  var el = document.getElementById('e-de-editableDiv');
  if (el) el.innerHTML = '';
};
window.setPlaceholder = (placeholderText) => {
  var el = document.getElementById('e-de-editableDiv');
  if (el && (el.innerText || '').trim() === '') {
    el.innerText = placeholderText || '';
    el.classList.add('placeHoldr');
  }
};
window.removePlaceholder = (placeholderText) => {
  var el = document.getElementById('e-de-editableDiv');
  if (!el) return;
  if (el.innerText === placeholderText) {
    el.innerText = '';
    el.classList.remove('placeHoldr');
  }
};


window.getAIButtonPosition = function () {
  var aiButton = document.getElementsByClassName('e-control e-btn ai-assist-btn e-fab')[0];
  if (!aiButton) {
    return;
  }
  var aiButtonRect = aiButton.getBoundingClientRect();
  var x = aiButtonRect.left;
  var y = aiButtonRect.top;
  return { x: x, y: y };
}

window.toggleSendIcon = function (isEnabled) {
  const sendElement = document.querySelector(".ai-assist-dialog .e-icons.e-send");
  if (sendElement) {
    if (isEnabled) {
      sendElement.classList.remove('e-disabled');
    } else {
      sendElement.classList.add('e-disabled');
    }
  }
};


window.getGeneratingDraftPosition = function () {
  var aiButton = document.getElementsByClassName('e-control ai-assist-btn e-fab')[0];
  if (!aiButton) {
    return;
  }
  var aiButtonRect = aiButton.getBoundingClientRect();
  var aiButtonLeft = aiButtonRect.left;
  var aiButtonTop = aiButtonRect.top;
  var documnetEditor = 
    document.getElementById("document-editor") ||
    document.getElementById("container") ||
    document.querySelector(".e-documenteditor-container");
  if (!documnetEditor) {
    return;
  }
  var documnetEditorRect = documnetEditor.getBoundingClientRect();
  var documnetEditorTop = documnetEditorRect.top;
  var sampleMargin = 8;
  var x = aiButtonLeft - sampleMargin;
  var y = aiButtonTop - documnetEditorTop;
  return { x: x, y: y };
}

window.setGeneratingDraftPosition = function (x, y) {
  var element = document.getElementsByClassName('e-stop-generating-dialog')[0];
  if (element) {
    element.style.position = 'absolute';
    element.style.left = x + 'px';
    element.style.top = y + 'px';
  }
};
window.showGeneratingDraft = function (isShow) {
  var stopPopupElement = document.querySelector('.e-stop-generating-dialog');
  if (stopPopupElement) {
    if (isShow) {
      stopPopupElement.style.display = "block";
    }
    else {
      stopPopupElement.style.display = "none";
    }
  }
}

window.setAIAssistBtnIconSize = function (AIAssistBtnIconSize) {
  var iconElement = document.querySelector(".ai-assist-btn .e-icons.e-ai-assist-btn");
  if (iconElement) {
    iconElement.style.fontSize = AIAssistBtnIconSize + "px";
    iconElement.style.height = AIAssistBtnIconSize + "px";
    iconElement.style.width = AIAssistBtnIconSize + "px";
    iconElement.style.lineHeight = (AIAssistBtnIconSize + 1) + "px";
  }
}

window.getRegeneratePopupPosition = function () {
  var statusBar = document.querySelector(".e-de-status-bar");
  if (!statusBar) {
    return;
  }
  var statusBarRect = statusBar.getBoundingClientRect();
  var statusBarTop = statusBarRect.top;
  var regeneratePopupHeight = 175;
  var sampleMargin = 8;
  var x = 130;
  var y = (statusBarTop - regeneratePopupHeight) - sampleMargin;
  return { x: x, y: y };
}