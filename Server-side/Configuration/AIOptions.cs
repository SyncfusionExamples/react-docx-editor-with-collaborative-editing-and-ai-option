namespace CollaborativeEditingServerSide.Configuration
{
    public class AIOptions
    {
        /// <summary>
        /// AzureOpenAI | ClaudeAI | GeminiAI
        /// </summary>
        public string Provider { get; set; } = "AzureOpenAI";
    }
}