import AIPopup from "./AIPopup";
import * as React from 'react';
import { useNavigate, useParams, type NavigateFunction } from 'react-router-dom';
import "./editor-helpers";
import "./AIPopup.css";
import "./App.css";
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-react-documenteditor/styles/material.css';
import "./helpers";
import { AIAssistViewComponent, ViewsDirective, ViewDirective, PromptResponse } from '@syncfusion/ej2-react-interactive-chat';

import { getDocumentText } from './summarizer';

import {
  DocumentEditorContainerComponent,
  Ribbon,
  CollaborativeEditingHandler,
  type ContainerContentChangeEventArgs,
  type Operation,
  Inject,
  DocumentEditor,
} from '@syncfusion/ej2-react-documenteditor';

import {
  HubConnectionBuilder,
  HttpTransportType,
  HubConnectionState,
  HubConnection,
  LogLevel,
} from '@microsoft/signalr';

import { hideSpinner, showSpinner } from '@syncfusion/ej2-popups';

import { TitleBar } from './title-bar';
import { dataService } from './data-service';
import { processPrompt } from "./ai-service";

DocumentEditor.Inject(CollaborativeEditingHandler);

const USERS = [
  'Kathryn Fuller',
  'Tamer Fuller',
  'Martin Nancy',
  'Davolio Leverling',
  'Nancy Fuller',
  'Fuller Margaret',
  'Leverling Andrew',
];

export default function EditorPageWrapper() {
  const { fileName, roomId } = useParams<{ fileName: string; roomId: string }>();
  const navigate = useNavigate();

  return (
    <Editor
      fileName={decodeURIComponent(fileName || '')}
      roomId={roomId || ''}
      navigate={navigate}
    />
  );
}

interface EditorProps {
  fileName: string;
  roomId: string;
  navigate: NavigateFunction;
}

interface EditorState {

    showDialog: boolean;

    userName: string;

    isUserNameEntered: boolean;

    isAIEnabled: boolean;

    openChat: boolean;

    aiSuggestions: string[];

    assistInitialPos:{
      left:number;
      top:number;
      width:number;
      height:number;
    }
}

class Editor extends React.Component<EditorProps, EditorState> {
  public API_BASE = 'http://localhost:5212/';

  public assistInstance = React.createRef<AIAssistViewComponent>();
  public container: DocumentEditorContainerComponent | null = null;
  public titleBar?: TitleBar;
  public collaborativeEditingHandler?: CollaborativeEditingHandler;
  public connectionId: string = '';
  public connection?: HubConnection;
  public currentRoomName: string = '';
  private caretTrackerId?: number;

  constructor(props: EditorProps) {
    super(props);
    const randomName = USERS[Math.floor(Math.random() * USERS.length)];
    this.state = {

      showDialog:true,

      userName:randomName,

      isUserNameEntered:false,

      isAIEnabled:false,

      openChat:false,

      aiSuggestions:[
          "Summarize this document"
      ],

      assistInitialPos:{
          left: 80,
          top: 160, 
          width: 24,
          height: 24
      }
    };    
  }
  
  
  private updateAssistButtonPosition = (): void => {
    const editor = this.container?.documentEditor;
    if (!editor) return;

    setTimeout(() => {
      try {
        const pos = window?.getAIAssistBtnPosition?.();
        if (!pos) return;

        const nextPos = {
          left: Math.round(pos.x),
          top: Math.round(pos.y),
          width: Math.round(24 * editor.zoomFactor),
          height: Math.round(24 * editor.zoomFactor)
        };

        this.setState(prev => {
          const cur = prev.assistInitialPos;
          if (
            cur.left === nextPos.left &&
            cur.top === nextPos.top &&
            cur.width === nextPos.width &&
            cur.height === nextPos.height
          ) {
            return null;
          }
          return { assistInitialPos: nextPos };
        });

        window.setAiAssistBtnIconSize?.(
          Math.round(14 * editor.zoomFactor),
          Math.round(24 * editor.zoomFactor)
        );
      } catch {}
    }, 10);
  };

  private onZoomFactorChange = (): void => {
    const editor = this.container?.documentEditor;
    if (!editor) return;

    setTimeout(() => {
      try {
        editor.focusIn();
      } catch { }
      this.updateAssistButtonPosition();
    }, 10);
  };

  
  private showChatPane = (): void => {
    this.setState({
        openChat: true,
        aiSuggestions: ['Summarize this document']
    });
  };

  private chatPanelCreated = (): void => {
    if (this.assistInstance.current) {
        this.assistInstance.current.toolbarSettings.itemClicked = (args: any) => {
            const itemClass = String(args?.item?.iconCss || '');
            if (itemClass.includes('e-close')) {
                this.setState({ openChat: false });
            }
        };
    }
  };

  private onResize = (): void => {
    this.onZoomFactorChange();
  };
  
  private get currentUser(): string {
    return this.state.userName?.trim() || 'Guest user';
  }

  private onUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ userName: e.target.value });
  };

  private onOkClick = () => {
    const name = this.state.userName.trim();
    if (!name) return;

    dataService.setAuthorName(name);
    this.setState({ showDialog: false, isUserNameEntered: true });
  };

  private onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') this.onOkClick();
  };

  public componentDidMount(): void {
    window.onbeforeunload = () => 'Want to save your changes?';
    window.addEventListener(
      "resize",
      this.onResize
    );
  }

  public componentWillUnmount(): void {
    this.titleBar?.destroy();
    window.onbeforeunload = null;
    window.removeEventListener(
      "resize",
      this.onResize
    );
    try {
      if (this.connection) {

        if (this.connection.state === HubConnectionState.Connected && this.currentRoomName) {
          this.connection
            .send('LeaveGroup', {
              roomName: this.currentRoomName,
              currentUser: this.currentUser,
            })
            .finally(() => this.connection?.stop());
        } else {
          this.connection.stop();
        }
      }
    } catch {
      // ignore cleanup errors
    }
  }

  public onContentChange = (args: ContainerContentChangeEventArgs) => {    
    this.updateAssistButtonPosition();
    const handler = this.container?.documentEditor?.collaborativeEditingHandlerModule;
    if (!handler) {  
      return;
    }

    handler.sendActionToServer(args.operations as Operation[]);
  };

  public onCreated = (): void => {
    if (!this.container) return;

    const editor = this.container?.documentEditor;
    if (!editor) return;
    try { editor.focusIn(); } catch { }
    this.updateAssistButtonPosition();

    if (this.props.fileName) {
      this.container.documentEditor.documentName = this.props.fileName;
    }

    this.container.documentEditor.enableCollaborativeEditing = true;
    this.collaborativeEditingHandler =
    this.container.documentEditor.collaborativeEditingHandlerModule;
    this.container.documentEditor.beforeXmlHttpRequestSend = (args: any) => {
      console.log('[beforeXmlHttpRequestSend]', {
        url: args?.url,
        method: args?.httpRequest?.method,
        headers: args?.httpRequest?.getAllResponseHeaders?.(),
        data: args?.data ?? args?.requestData ?? null,
        raw: args,
      });
    };
    // Optional editor settings
    this.container.documentEditor.pageOutline = '#E0E0E0';
    this.container.documentEditor.acceptTab = true;
    this.container.documentEditor.resize();
    this.onZoomFactorChange();
    this.container.documentEditor.selection.selectRange(
    this.container.documentEditor.documentStart,
    this.container.documentEditor.documentStart
    );
    this.container.documentEditor.zoomFactorChange = () => {
      this.onZoomFactorChange();
    };
    this.initializeTitleBar();
    this.initializeSignalR();
    this.loadDocumentFromServer();
    this.titleBar?.updateDocumentTitle();
  };

  private initializeTitleBar(): void {
    this.titleBar = new TitleBar(
      document.getElementById('documenteditor_titlebar') as HTMLElement,
      this.container!.documentEditor,
      true,
      dataService,
      () => this.leaveRoomAndRedirect(),
      (enabled: boolean) => {

        console.log("DocumentEditor callback:", enabled);

        this.setState({
            isAIEnabled: enabled,
            openChat: false
        }, () => {
            console.log("State:", this.state.isAIEnabled);
        });

      }
    );
  }

  private leaveRoomAndRedirect(): void {
    const goHome = () => {
      dataService.setIsAuthorOpened(false);
      this.props.navigate('/');
    };

    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      this.connection
        .send('LeaveGroup', {
          roomName: this.currentRoomName,
          currentUser: this.currentUser,
        })
        .then(goHome)
        .catch(goHome);
    } else {
      goHome();
    }
  }  

  public initializeSignalR = (): void => {
    if (this.connection) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(this.API_BASE + 'documenteditorhub', {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    this.connection.on('dataReceived', this.onDataReceived);

    this.connection.onclose(() => {
      if (this.connection?.state === HubConnectionState.Disconnected) {
        alert('Connection lost. Please reload the browser to continue.');
      }
    });

    this.connection.onreconnected(() => {
      if (this.connection && this.currentRoomName) {
        this.connection.send('JoinGroup', {
          roomName: this.currentRoomName,
          currentUser: this.currentUser,
        });
      }
    });
  };

  public onDataReceived = (action: string, data: any) => {

    const handler = this.container?.documentEditor?.collaborativeEditingHandlerModule;
    if (!handler) return;

    // Store connectionId locally
    if (action === 'connectionId') {
      this.connectionId = data;
    }

    // Update TitleBar only for messages from other users
    if (this.connectionId && this.connectionId !== data?.connectionId) {
      if (this.titleBar) {
        if (action === 'action' || action === 'addUser') {
          this.titleBar.addUser(data);
        } else if (action === 'removeUser') {
          this.titleBar.removeUser(data);
        }
      }
    }

    // Always forward ALL actions
    handler.applyRemoteAction(action, data);

  };

  public openDocument(responseText: string, roomName: string): void {
    const containerEl = document.getElementById('container') as HTMLElement | null;
    if (containerEl) showSpinner(containerEl);

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      
      if (containerEl) hideSpinner(containerEl);
      alert('ImportFile returned invalid JSON. Check server logs / response.');
      return;
    }

    const version = data?.version;
    const rawSfdt = data?.sfdt;

    if (!rawSfdt) {
      
      if (containerEl) hideSpinner(containerEl);
      alert('SFDT is empty/undefined. Server did not return document content.');
      return;
    }

    // Some servers may return sfdt as object; DocumentEditor expects string
    const sfdt = typeof rawSfdt === 'string' ? rawSfdt : JSON.stringify(rawSfdt);


    // ALWAYS get live handler
    const handler = this.container?.documentEditor?.collaborativeEditingHandlerModule;
    if (!handler) {
      if (containerEl) hideSpinner(containerEl);
      throw new Error("collaborativeEditingHandlerModule is undefined");
    }

    const collabBaseUrl = this.API_BASE+"api/CollaborativeEditing/";

    handler.updateRoomInfo(roomName, version, collabBaseUrl);
    this.container?.documentEditor.open(sfdt);


    // Connect SignalR + JoinGroup (CRITICAL for real-time collaboration)
    setTimeout(() => {
      this.connectToRoom({
        roomName,
        currentUser: this.currentUser,
      });
      this.container?.documentEditor.selection.selectRange(
        this.container.documentEditor.documentStart,
        this.container.documentEditor.documentStart);
      this.onZoomFactorChange();
    }, 0);

    if (containerEl) hideSpinner(containerEl);
  }

  public loadDocumentFromServer(): void {

    const docName = this.props.fileName || 'Giant Panda.docx';
    let { roomId } = this.props;
    let roomName = roomId;
    if (!roomName) {
      const urlParams = new URLSearchParams(window.location.search);
      roomName = urlParams.get('id') || Math.random().toString(32).slice(2);
      window.history.replaceState({}, '', `?id=${roomName}`);
    }
    const httpRequest = new XMLHttpRequest();
    httpRequest.open('POST', this.API_BASE + 'api/CollaborativeEditing/ImportFile', true);
    httpRequest.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    httpRequest.onreadystatechange = () => {
      if (httpRequest.readyState !== 4) return;

      if (httpRequest.status === 200 || httpRequest.status === 304) {
        this.openDocument(httpRequest.responseText, roomName);
      } else {
        alert(`ImportFile failed: ${httpRequest.status} ${httpRequest.statusText}`);
      }
    };

    httpRequest.send(JSON.stringify({ fileName: docName, documentOwner: roomName }));

  }

  public connectToRoom = async (data: { roomName: string; currentUser: string }) => {
    try {
      this.currentRoomName = data.roomName;
      if (!this.connection) return;

      if (this.connection.state === HubConnectionState.Disconnected) {
        await this.connection.start();
        
      }

      if (this.connection.state === HubConnectionState.Connected) {
        await this.connection.send('JoinGroup', {
          roomName: data.roomName,
          currentUser: data.currentUser,
        });
        
      }
    } catch (err) {
      
      setTimeout(() => this.connectToRoom(data), 5000);
    }
  };
  

  render() {
    const { showDialog, userName, isUserNameEntered } = this.state;
    const { openChat, aiSuggestions, assistInitialPos }= this.state;

    return (
      <div className="control-pane">
        {/* Username Dialog */}
        {showDialog && (
          <div id="dialog-container">
            <div className="username-dialog-box">
              <div className="username-dialog-title">Enter your name</div>
              <div className="username-dialog-body">
                <input
                  id="userNameInput"
                  type="text"
                  className="e-input"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={this.onUserNameChange}
                  onKeyDown={this.onKeyDown}
                  autoFocus
                />
              </div>
              <div className="username-dialog-footer">
                <button
                  className="e-btn e-primary"
                  onClick={this.onOkClick}
                  disabled={!userName.trim()}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        {isUserNameEntered && (
          <div>
            {/* Hidden div for Share URL dialog content (if your TitleBar uses it) */}
            <div id="shareDialog" style={{ display: 'none' }}>
              <div className="e-de-para-dlg-heading">
                Share this URL with others for real-time editing
              </div>
              <div className="e-de-container-row" style={{ display: 'flex', marginTop: 8 }}>
                <input
                  type="text"
                  id="share_url"
                  className="e-input"
                  readOnly
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div id="documenteditor_titlebar" className="e-de-ctn-title"></div>

            <div id="documenteditor_container_body">
              <DocumentEditorContainerComponent
                id="container"
                style={{
                    width:this.state.openChat ? "65%" : "100%",
                    float:"left",
                    height:"calc(100vh - 51px)"
                }}
                ref={(scope: DocumentEditorContainerComponent | null) => {
                  this.container = scope;
                }}
                created={this.onCreated}
                contentChange={this.onContentChange}
                height={'calc(100vh - 51px)'}
                currentUser={this.currentUser}
                serviceUrl={this.API_BASE + 'api/documenteditor'}

                toolbarMode="Ribbon"
                enableToolbar={true}
                locale="en-US"
              >
                <Inject services={[Ribbon]} />
              </DocumentEditorContainerComponent>
              <AIPopup
                editorRef={this.container}

                chatOpen={this.state.openChat}

                assistInitialPos={this.state.assistInitialPos}

                isAIEnabled={this.state.isAIEnabled}

                onShowChatPane={this.showChatPane} />          
            </div>
             {this.state.openChat && (

              <div
                  className="ai-chat-container"
                  style={{
                      width: "35%",
                      float: "right",
                      height: "calc(100vh - 51px)",
                      position: "relative"
                  }}
              >
              <AIAssistViewComponent
                      ref={this.assistInstance}
                      cssClass="e-aiassist-chat"
                      promptPlaceholder="Type a question"
                      promptSuggestions={this.state.aiSuggestions}
                      promptIconCss="e-icons e-aiassist-chat-icon"
                      responseIconCss="e-aiassist-chat-icon"
                      created={this.chatPanelCreated}
                      toolbarSettings={{
                        items: [{ iconCss: 'e-icons e-close', align: 'Right', tooltip: 'Close' }]
                      }}
                      bannerTemplate={() =>
                        <div className="ai-assist-banner">
                          <div className="e-icons e-aiassist-page-icon"></div>
                          <div className="e-aiassist-page-header">How can I help you?</div>
                        </div>
                      }
                      promptRequest={async (args) => {
                        const prompt = String(args?.prompt || '').trim();
                        if (!prompt) { args.response = ''; return; }
                        try {
                          if (prompt === 'Summarize this document') {
                            await new Promise(resolve => {
                              requestAnimationFrame(() => setTimeout(resolve, 10));
                            });
                            const documentContent = await getDocumentText({ current: this.container });
                            const options = {
                              messages: [
                                { role: "system", content: `You are a helpful assistant. Your task is to analyze the provided text and generate short summary. Always respond in proper HTML format, but do not include <html>, <head>, or <body> tags.` },
                                { role: "user", content: documentContent }
                              ],
                              model: "gpt-4",
                            };
                            const summaryHtml = await processPrompt(options);
                            args.response = summaryHtml || '<p>No summary available.</p>';
                            this.assistInstance.current?.addPromptResponse(args.response);
                            const suggestionsRaw = await processPrompt({
                              messages: [
                                { role: "system", content: `You are a helpful assistant. Your task is to analyze the provided text and generate 3 short diverse questions and each question should not exceed 10 words` },
                                { role: "user", content: documentContent }
                              ],
                              model: "gpt-4",
                            });
                            if (suggestionsRaw) {
                              const next = (suggestionsRaw.split(/\d+\.\s*/).filter(x => x.trim() !== "")).map((text, index) => {
                                return `${index + 1}. ${text.trim()}`;
                              });
                              if (next.length) { this.setState({ aiSuggestions: next }); }
                            }
                          } else {

                            await new Promise(resolve => {
                              requestAnimationFrame(() => setTimeout(resolve, 10));
                            });

                            const options = {
                              messages: [
                                { role: "system", content: `You are a helpful assistant. Use the provided context to answer the user question. Always respond in proper HTML format, but do not include <html>, <head>, or <body> tags. Context:` },
                                { role: "user", content: prompt }
                              ],
                              model: "gpt-4",
                            };
                            const answerHtml = await processPrompt(options);
                            var response = String(answerHtml ?? '<p>No answer.</p>');
                            args.response = response;
                            this.assistInstance.current?.addPromptResponse(response);
                          }
                        } catch (e) {
                          args.response = `<p class="aiassist-error">AI error: ${e}</p>`;
                        }
                      }}
                      responseToolbarSettings={{
                        items: [
                          { iconCss: 'e-icons e-copy', tooltip: 'copy' },
                          { iconCss: 'e-btn-icon e-de-ctnr-new', tooltip: 'insert' }
                        ],
                        itemClicked: async (e) => {
                          const idx = typeof e?.dataIndex === 'number'
                            ? e.dataIndex
                            : (this.assistInstance.current?.prompts?.length ?? 1) - 1;
                          const resHtml = this.assistInstance.current?.prompts?.[idx]?.response ?? '';
                          if (!resHtml) return;
                          const tmp = document.createElement('div');
                          tmp.innerHTML = resHtml;
                          const plainText = (tmp.innerText || '').trim();
                          const tip = (e?.item?.tooltip || '').toLowerCase();
                          if (tip === 'copy') {
                            if (navigator.clipboard && window.ClipboardItem) {
                              const blobHtml = new Blob([resHtml], { type: 'text/html' });
                              const blobText = new Blob([plainText], { type: 'text/plain' });
                              await navigator.clipboard.write([
                                new ClipboardItem({
                                  'text/html': blobHtml,
                                  'text/plain': blobText
                                })
                              ]);
                            } else {
                              await navigator.clipboard?.writeText(plainText);
                            }
                          } else if (tip === 'insert') {
                            const editor = this.container?.documentEditor?.editor;
                            if (editor && plainText) {
                              editor.insertText(plainText);
                            }
                          }
                        }
                      }}
                    >
                      <ViewsDirective>
                        <ViewDirective iconCss="e-icons e-aiassist-chat-header" />
                      </ViewsDirective>
                    </AIAssistViewComponent>
              </div>

            )}
          </div>
        )}
      </div>
    );
  }
}

export { Editor };