"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select } from "@/components/ui/select"
import { MessageCircle, FileText, Users, Send, Download, Plus, Check, MapPin, Heart, Edit, FileEdit, Eye, Save, Upload, ChevronRight } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function BuildScriptTab() {
  const {
    GUIDED_QUESTIONS,
    editWeddingDetails,
    aiChatMessages,
    aiInput,
    setAiInput,
    isGeneratingScript,
    generatedScripts,
    scriptBuilderTab,
    setScriptBuilderTab,
    scriptMode,
    chatMessages,
    currentQuestionIndex,
    isTyping,
    chatInput,
    setChatInput,
    selectedCeremonyStyle,
    setSelectedCeremonyStyle,
    selectedCeremonyLength,
    setSelectedCeremonyLength,
    selectedUnityCeremony,
    setSelectedUnityCeremony,
    selectedVowsType,
    setSelectedVowsType,
    hasGeneratedScript,
    chatMessagesRef,
    editingScript,
    setEditingScript,
    scriptContent,
    setScriptContent,
    editorFontSize,
    editorRef,
    handleAiMessage,
    handleGenerateScript,
    handleModeSelect,
    handleChatSubmit,
    handleQuickResponse,
    generateAndSaveScript,
    resetChatbot,
    handleGenerateRequest,
    applyFormatting,
    applyTextColor,
    autoSave,
    handleEditScript,
    handleViewScript,
    handleDownloadScript,
    handleUploadScript,
    handleSaveScript,
    uploadingScript,
    handleSendToEditor,
  } = useCommunicationPortal()

  return (
<TabsContent value="buildscript">
            <div className="space-y-6">
              {/* Script Writing Mode Toggle */}
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <CardTitle className="text-white flex items-center">
                    <FileEdit className="w-5 h-5 mr-2" />
                    Script Writing Mode
                  </CardTitle>
                  <CardDescription className="text-blue-100">Choose your approach to creating the ceremony script</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex space-x-3 mb-6">
                    <Button
                      variant={scriptMode === 'guided' ? 'default' : 'outline'}
                      onClick={() => handleModeSelect("guided")}
                      className={`${scriptMode === 'guided' ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-200 text-green-700 hover:bg-green-50'}`}
                    >
                      Guided Mode
                    </Button>
                    <Button
                      variant={scriptMode === 'expert' ? 'default' : 'outline'}
                      onClick={() => handleModeSelect("expert")}
                      className={`${scriptMode === 'expert' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
                    >
                      Freelance / Expert Mode
                    </Button>
                  </div>

                  {/* Mode Descriptions */}
                  {scriptMode === 'guided' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-green-900">AI-Guided Script Creation</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetChatbot}
                          className="text-green-700 border-green-300 hover:bg-green-100"
                        >
                          Reset Chat
                        </Button>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-900">
                            Guided Questions Progress
                          </span>
                          <span className="text-sm font-semibold text-green-700">
                            {currentQuestionIndex} / {GUIDED_QUESTIONS.length} completed
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-3 border border-green-200 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                            style={{
                              width: `${(currentQuestionIndex / GUIDED_QUESTIONS.length) * 100}%`
                            }}
                          >
                            {currentQuestionIndex > 0 && (
                              <span className="text-xs font-bold text-white drop-shadow">
                                {Math.round((currentQuestionIndex / GUIDED_QUESTIONS.length) * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {currentQuestionIndex === GUIDED_QUESTIONS.length && (
                          <p className="text-xs text-green-700 mt-2 font-medium flex items-center">
                            <Check className="w-4 h-4 mr-1" />
                            All questions completed! You can now refine your script.
                          </p>
                        )}
                      </div>

                      {/* Ceremony Configuration */}
                      <div className="mb-6 p-4 bg-white border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-3">Quick Setup</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-1">Ceremony Style</label>
                            <select
                              className="w-full p-2 border border-green-200 rounded text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              value={selectedCeremonyStyle}
                              onChange={(e) => setSelectedCeremonyStyle(e.target.value)}
                            >
                              <option value="">Select a style...</option>
                              <option value="Traditional">Traditional</option>
                              <option value="Modern">Modern</option>
                              <option value="Religious">Religious</option>
                              <option value="Secular">Secular</option>
                              <option value="Interfaith">Interfaith</option>
                              <option value="Custom">Custom</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-1">Ceremony Length</label>
                            <select
                              className="w-full p-2 border border-green-200 rounded text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              value={selectedCeremonyLength}
                              onChange={(e) => setSelectedCeremonyLength(e.target.value)}
                            >
                              <option value="">Select duration...</option>
                              <option value="15-20 minutes">15-20 minutes</option>
                              <option value="20-30 minutes">20-30 minutes</option>
                              <option value="30-45 minutes">30-45 minutes</option>
                              <option value="45+ minutes">45+ minutes</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-1">Unity Ceremony</label>
                            <select
                              className="w-full p-2 border border-green-200 rounded text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              value={selectedUnityCeremony}
                              onChange={(e) => setSelectedUnityCeremony(e.target.value)}
                            >
                              <option value="">Select unity ceremony...</option>
                              <option value="None">None</option>
                              <option value="Handfasting">Handfasting</option>
                              <option value="Unity Candle">Unity Candle</option>
                              <option value="Sand Ceremony">Sand Ceremony</option>
                              <option value="Wine/Jar Ceremony">Wine/Jar Ceremony</option>
                              <option value="Unity Painting">Unity Painting</option>
                              <option value="Ring Warming">Ring Warming</option>
                              <option value="Cord of Three Strands">Cord of Three Strands</option>
                              <option value="Tree Planting">Tree Planting</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-900 mb-1">Vows</label>
                            <select
                              className="w-full p-2 border border-green-200 rounded text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              value={selectedVowsType}
                              onChange={(e) => setSelectedVowsType(e.target.value)}
                            >
                              <option value="">Select vow style...</option>
                              <option value="Traditional">Traditional</option>
                              <option value="Personal">Personal</option>
                              <option value="Modern">Modern</option>
                              <option value="Personal and Modern">Personal and Modern</option>
                              <option value="Repeating Vows">Repeating Vows</option>
                              <option value="Community Vows">Community Vows</option>
                            </select>
                          </div>
                        </div>

                        <Button
                          onClick={handleGenerateRequest}
                          disabled={!selectedCeremonyStyle || !selectedCeremonyLength}
                          className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Generate Script Request for Mr. Script
                        </Button>

                        {selectedCeremonyStyle && selectedCeremonyLength && (
                          <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-800">
                            <strong>Selected:</strong> {selectedCeremonyStyle} ceremony, {selectedCeremonyLength} duration
                            {selectedUnityCeremony && selectedUnityCeremony !== "None" && (
                              <span>, {selectedUnityCeremony} unity ceremony</span>
                            )}
                            {selectedVowsType && (
                              <span>, {selectedVowsType} vows</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Chatbot Interface */}
                      <div className="bg-white border border-green-200 rounded-lg">
                        {/* Chat Messages */}
                        <div className="h-96 overflow-y-auto p-4 space-y-4" ref={chatMessagesRef}>
                          {chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.type === 'user'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className="whitespace-pre-wrap text-sm">
                                  {message.content}
                                </div>
                                <div className={`text-xs mt-1 ${
                                  message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                                }`}>
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Typing Indicator */}
                          {isTyping && (
                            <div className="flex justify-start">
                              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                                <div className="flex items-center space-x-1">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                  <span className="text-xs text-gray-500 ml-2">Mr. Script is typing...</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Quick Response Options */}
                        {currentQuestionIndex < GUIDED_QUESTIONS.length &&
                         GUIDED_QUESTIONS[currentQuestionIndex]?.type === 'multiple-choice' &&
                         !isTyping && (
                          <div className="border-t border-gray-200 p-3">
                            <div className="flex flex-wrap gap-2">
                              {GUIDED_QUESTIONS[currentQuestionIndex].options?.map((option) => (
                                <Button
                                  key={option}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickResponse(option)}
                                  className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                                >
                                  {option}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Chat Input */}
                        <div className="border-t border-gray-200 p-3">
                          <div className="flex items-center space-x-2">
                            <Input
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Type your response here..."
                              className="flex-1 border-green-200 focus:border-green-400"
                              onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                              disabled={isTyping}
                            />
                            <Button
                              onClick={handleChatSubmit}
                              disabled={!chatInput.trim() || isTyping}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Script Generation Action Buttons */}
                          <div className="mt-4 pt-4 border-t-2 border-gray-200">
                            <div className="grid grid-cols-3 gap-2">
                              {/* Generate Initial Script - Green */}
                              <div className="relative">
                                <Button
                                  onClick={generateAndSaveScript}
                                  disabled={!selectedCeremonyStyle || !selectedCeremonyLength}
                                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 disabled:bg-gray-300 disabled:cursor-not-allowed flex-col h-auto w-full"
                                >
                                  <FileText className="w-5 h-5 mb-1" />
                                  <span className="text-xs">Generate Initial Script</span>
                                </Button>
                                <ChevronRight className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-900 z-10" />
                              </div>

                              {/* Refine Script - Blue (enabled after questions answered) */}
                              <div className="relative">
                                <Button
                                  onClick={generateAndSaveScript}
                                  disabled={currentQuestionIndex < GUIDED_QUESTIONS.length}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 disabled:bg-gray-300 disabled:cursor-not-allowed flex-col h-auto w-full"
                                  title={currentQuestionIndex < GUIDED_QUESTIONS.length ? "Answer all guided questions first" : "Refine your script"}
                                >
                                  <Edit className="w-5 h-5 mb-1" />
                                  <span className="text-xs">Refine Script</span>
                                </Button>
                                <ChevronRight className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-900 z-10" />
                              </div>

                              {/* Generate Final Script - Pink */}
                              <Button
                                onClick={handleSendToEditor}
                                disabled={!hasGeneratedScript}
                                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-medium py-3 disabled:bg-gray-300 disabled:cursor-not-allowed flex-col h-auto"
                                title={!hasGeneratedScript ? "Generate a script first" : "Generate final script and open in editor"}
                              >
                                <FileEdit className="w-5 h-5 mb-1" />
                                <span className="text-xs">Generate Final Script</span>
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                              {currentQuestionIndex < GUIDED_QUESTIONS.length
                                ? `Answer ${GUIDED_QUESTIONS.length - currentQuestionIndex} more question(s) to unlock Refine Script`
                                : hasGeneratedScript
                                  ? "Click Generate Final Script to open in editor"
                                  : "Start with Generate Initial Script"}
                            </p>
                          </div>
                        </div>
                      </div>


                    </div>
                  )}
                  {scriptMode === 'expert' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">Freelance / Expert Mode</h3>
                      <p className="text-sm text-blue-800 mb-3">For experienced officiants who have performed weddings before and want full control to customize the ceremony.</p>

                      <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Expert Mode Features:</strong>
                        </p>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1">
                          <li>• Full access to the script editor with advanced formatting</li>
                          <li>• No guided questions - direct script creation</li>
                          <li>• Complete customization freedom</li>
                          <li>• Perfect for experienced officiants</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {!scriptMode && (
                    <div className="text-center p-8 text-gray-500">
                      <p>Please select a script writing mode to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Script Builder Interface - Only show for Expert Mode or when no mode selected */}
              {(scriptMode === 'expert' || !scriptMode) && (
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className={`flex items-center ${!scriptMode ? 'text-gray-400' : 'text-blue-900'}`}>
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Mr. Script Builder
                    </CardTitle>
                    <CardDescription className={!scriptMode ? 'text-gray-400' : ''}>
                      {!scriptMode ? 'Please select a script writing mode above to get started' : 'Create personalized ceremony scripts with Mr. Script for Sarah Johnson & David Chen'}
                    </CardDescription>
                  </CardHeader>
                <CardContent className={`p-0 ${!scriptMode ? 'opacity-40 pointer-events-none' : ''}`}>
                  {/* Secondary Tabs for Script Builder */}
                  <Tabs value={scriptBuilderTab} onValueChange={setScriptBuilderTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-blue-50 border-b border-blue-100">
                      <TabsTrigger value="mr-script" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white" disabled={!scriptMode}>
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Mr. Script
                      </TabsTrigger>
                      <TabsTrigger value="templates" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white" disabled={!scriptMode}>
                        <FileText className="w-4 h-4 mr-1" />
                        Templates
                      </TabsTrigger>
                      <TabsTrigger value="editor" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white" disabled={!scriptMode}>
                        <Edit className="w-4 h-4 mr-1" />
                        Script Editor
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white" disabled={!scriptMode}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </TabsTrigger>
                    </TabsList>

                    {/* Mr. Script Tab */}
                    <TabsContent value="mr-script" className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chat Interface */}
                        <div className="lg:col-span-2">
                          <Card className="h-[600px] flex flex-col">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-lg text-gray-900">Mr. Script</CardTitle>
                              <CardDescription>Ask me anything about creating your wedding ceremony script</CardDescription>
                            </CardHeader>

                            {/* Chat Messages */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                              {aiChatMessages.map((message) => (
                                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div
                                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                      message.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white border border-gray-200 text-gray-900'
                                    }`}
                                  >
                                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                    <div className={`text-xs mt-2 ${
                                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                    }`}>
                                      {message.timestamp}
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Loading indicator */}
                              {isGeneratingScript && (
                                <div className="flex justify-start">
                                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                                    <div className="flex items-center space-x-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                      <span className="text-sm text-gray-600">Generating response...</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-gray-200">
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Ask about ceremony scripts, traditions, vows, or anything else..."
                                  value={aiInput}
                                  onChange={(e) => setAiInput(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleAiMessage()}
                                  className="flex-1"
                                />
                                <Button
                                  onClick={handleAiMessage}
                                  disabled={!aiInput.trim() || isGeneratingScript}
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Quick Actions Sidebar */}
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg text-gray-900">Quick Script Generation</CardTitle>
                              <CardDescription>Generate scripts instantly with one click</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Upload Existing Script Button */}
                              <div>
                                <input
                                  type="file"
                                  id="script-upload"
                                  className="hidden"
                                  accept=".doc,.docx,.pdf,.txt,.wps,.rtf"
                                  onChange={handleUploadScript}
                                  disabled={uploadingScript}
                                />
                                <label htmlFor="script-upload" className="block">
                                  <Button
                                    asChild
                                    disabled={uploadingScript}
                                    className="w-full justify-start bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0"
                                  >
                                    <span>
                                      <Upload className="w-4 h-4 mr-2" />
                                      {uploadingScript ? "Uploading..." : "Upload Existing Script"}
                                    </span>
                                  </Button>
                                </label>
                                <p className="text-xs text-gray-500 mt-1 px-1">
                                  Upload .doc, .pdf, .txt - Names auto-personalized
                                </p>
                              </div>

                              <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                  <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                  <span className="bg-white px-2 text-gray-500">Or Generate New</span>
                                </div>
                              </div>

                              <Button
                                onClick={() => handleGenerateScript('Traditional')}
                                disabled={isGeneratingScript}
                                className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Traditional Ceremony
                              </Button>
                              <Button
                                onClick={() => handleGenerateScript('Modern')}
                                disabled={isGeneratingScript}
                                className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Heart className="w-4 h-4 mr-2" />
                                Modern Ceremony
                              </Button>
                              <Button
                                onClick={() => handleGenerateScript('Interfaith')}
                                disabled={isGeneratingScript}
                                className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Users className="w-4 h-4 mr-2" />
                                Interfaith Ceremony
                              </Button>
                              <Button
                                onClick={() => handleGenerateScript('Beach')}
                                disabled={isGeneratingScript}
                                className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <MapPin className="w-4 h-4 mr-2" />
                                Beach/Outdoor
                              </Button>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg text-gray-900">Generated Scripts</CardTitle>
                              <CardDescription>{generatedScripts.length} scripts created</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {generatedScripts.map((script) => (
                                <div key={script.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm text-gray-900">{script.title}</p>
                                      <p className="text-xs text-gray-500 mt-1">{script.createdDate}</p>
                                      <Badge variant="outline" className="mt-2 text-xs">
                                        {script.type}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-blue-600 hover:text-blue-700"
                                        onClick={() => handleViewScript(script)}
                                        title="View script"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-green-600 hover:text-green-700"
                                        onClick={() => handleEditScript(script)}
                                        title="Edit script"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-gray-600 hover:text-gray-700"
                                        onClick={() => handleDownloadScript(script)}
                                        title="Download script"
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg text-gray-900">Couple Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Couple:</span> Sarah & David
                              </div>
                              <div>
                                <span className="font-medium">Venue:</span> {editWeddingDetails.venueName}
                              </div>
                              <div>
                                <span className="font-medium">Date:</span> {new Date(editWeddingDetails.weddingDate).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Guests:</span> {editWeddingDetails.expectedGuests} people
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Templates Tab */}
                    <TabsContent value="templates" className="p-6">
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Script Templates</h3>
                        <p className="text-gray-500 mb-4">Browse and customize pre-made ceremony templates</p>
                        <Button variant="outline" className="border-blue-200 text-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Coming Soon
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Script Editor Tab */}
                    <TabsContent value="editor" className="p-6">
                      {editingScript ? (
                        <div className="flex flex-col h-[800px]">
                          {/* Editor Header */}
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {editingScript.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Edit and customize your ceremony script
                            </p>
                          </div>

                          {/* Toolbar */}
                          <div className="flex items-center space-x-2 p-4 border bg-gray-50 rounded-t-lg flex-wrap gap-2">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="font-bold hover:bg-blue-50"
                                onClick={() => applyFormatting('bold')}
                                title="Bold"
                              >
                                <strong>B</strong>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="italic hover:bg-blue-50"
                                onClick={() => applyFormatting('italic')}
                                title="Italic"
                              >
                                <em>I</em>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="underline hover:bg-blue-50"
                                onClick={() => applyFormatting('underline')}
                                title="Underline"
                              >
                                <u>U</u>
                              </Button>
                            </div>

                            <Separator orientation="vertical" className="h-6" />

                            {/* Color Palette */}
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-600 mr-1">Colors:</span>
                              {['#000000', '#FF0000', '#0000FF', '#008000', '#800080', '#FFA500', '#A52A2A', '#808080'].map((color) => (
                                <button
                                  key={color}
                                  className="w-6 h-6 rounded border border-gray-300 hover:border-gray-500 transition-colors"
                                  style={{ backgroundColor: color }}
                                  onClick={() => applyTextColor(color)}
                                  title={`Apply ${color} color`}
                                />
                              ))}
                            </div>

                            <Separator orientation="vertical" className="h-6" />

                            <select
                              className="px-2 py-1 border rounded text-sm"
                              onChange={(e) => {
                                document.execCommand('fontSize', false, e.target.value)
                              }}
                            >
                              <option value="3">Normal</option>
                              <option value="1">Small</option>
                              <option value="4">Large</option>
                              <option value="6">Extra Large</option>
                            </select>

                            <Separator orientation="vertical" className="h-6" />

                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => document.execCommand('justifyLeft')}
                                title="Align Left"
                              >
                                ⭲
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => document.execCommand('justifyCenter')}
                                title="Center"
                              >
                                ⭿
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => document.execCommand('justifyRight')}
                                title="Align Right"
                              >
                                ⭾
                              </Button>
                            </div>

                            <Separator orientation="vertical" className="h-6" />

                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => applyFormatting('insertUnorderedList')}
                                title="Bullet List"
                                className="hover:bg-blue-50"
                              >
                                • List
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => applyFormatting('insertOrderedList')}
                                title="Numbered List"
                                className="hover:bg-blue-50"
                              >
                                1. List
                              </Button>
                            </div>
                          </div>

                          {/* Editor */}
                          <div className="flex-1 border border-t-0 overflow-y-auto relative">
                            <div
                              ref={editorRef}
                              id="script-editor"
                              contentEditable
                              suppressContentEditableWarning={true}
                              className="w-full h-full min-h-[500px] p-6 focus:outline-none bg-white"
                              style={{
                                lineHeight: '1.8',
                                fontSize: `${editorFontSize}px`,
                                fontFamily: 'Georgia, serif',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word'
                              }}
                              key={editingScript?.id}
                              dangerouslySetInnerHTML={{ __html: scriptContent || '' }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()

                                  // Insert a line break at the current cursor position
                                  const selection = window.getSelection()
                                  if (selection && selection.rangeCount > 0) {
                                    const range = selection.getRangeAt(0)
                                    range.deleteContents()

                                    const br1 = document.createElement('br')
                                    const br2 = document.createElement('br')

                                    range.insertNode(br1)
                                    range.setStartAfter(br1)
                                    range.insertNode(br2)

                                    range.setStartAfter(br2)
                                    range.collapse(true)
                                    selection.removeAllRanges()
                                    selection.addRange(range)

                                    if (editorRef.current) {
                                      editorRef.current.focus()
                                    }
                                  }
                                }
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLDivElement
                                const newContent = target.innerHTML

                                if (newContent !== scriptContent) {
                                  setScriptContent(newContent)
                                }
                              }}
                              onBlur={(e) => {
                                const target = e.target as HTMLDivElement
                                const newContent = target.innerHTML
                                setScriptContent(newContent)
                                // Content is saved when user clicks Save button
                                // Auto-save is triggered via the Auto-Save button in toolbar
                              }}
                            />
                            {scriptContent === '' && (
                              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none p-6" style={{ fontSize: `${editorFontSize}px`, fontFamily: 'Georgia, serif' }}>
                                Start writing your ceremony script here...
                                <br /><br />
                                Use the formatting tools above:
                                <br />• <strong>Bold</strong>, <em>Italic</em>, and <u>Underline</u> text
                                <br />• Color text with the color palette
                                <br />• Create bullet and numbered lists
                              </div>
                            )}
                          </div>

                          {/* Status Bar */}
                          <div className="px-4 py-2 bg-gray-50 border text-sm text-gray-600 flex justify-between items-center rounded-b-lg">
                            <div>
                              Words: {scriptContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length} |
                              <span className={`
                                ${(() => {
                                  const charCount = scriptContent.replace(/<[^>]*>/g, '').length;
                                  if (charCount < 50) return 'text-red-600 font-medium';
                                  if (charCount > 6500) return 'text-orange-600 font-medium';
                                  if (charCount > 7000) return 'text-red-600 font-medium';
                                  return 'text-gray-600';
                                })()}
                              `}>
                                Characters: {scriptContent.replace(/<[^>]*>/g, '').length}/7,000
                              </span> |
                              Lines: {scriptContent.split(/<br\s*\/?>/gi).length}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span>Font Size: {editorFontSize}px</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={autoSave}
                                className="text-xs"
                              >
                                Auto-save
                              </Button>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-between items-center pt-4 mt-4 border-t">
                            <div className="text-sm text-gray-500">
                              <div>
                                <span className="font-medium">Last saved:</span> {editingScript?.lastModified || 'Never'}
                              </div>
                            </div>
                            <div className="flex space-x-3">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingScript(null)
                                  setScriptContent('')
                                }}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                Close Editor
                              </Button>
                              <Button
                                onClick={handleSaveScript}
                                className="bg-blue-500 hover:bg-blue-600"
                                disabled={(() => {
                                  const charCount = scriptContent.replace(/<[^>]*>/g, '').length;
                                  return charCount < 50 || charCount > 7000;
                                })()}
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save Script
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Edit className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Script Editor</h3>
                          <p className="text-gray-500 mb-4">Generate or upload a script to start editing</p>
                          <Button
                            variant="outline"
                            className="border-blue-200 text-blue-700"
                            onClick={() => setScriptBuilderTab('mr-script')}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Go to Mr. Script
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    {/* Preview Tab */}
                    <TabsContent value="preview" className="p-6">
                      <div className="text-center py-12">
                        <Eye className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Script Preview</h3>
                        <p className="text-gray-500 mb-4">Preview your ceremony script before the big day</p>
                        <Button variant="outline" className="border-blue-200 text-blue-700">
                          <Eye className="w-4 h-4 mr-2" />
                          Coming Soon
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              )}
            </div>
          </TabsContent>
  )
}
