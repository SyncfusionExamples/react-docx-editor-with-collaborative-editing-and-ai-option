namespace CollaborativeEditingServerSide.Model
{
    public class ChatRequest
    {
        public List<ChatMessageRequest> Messages { get; set; } = default!;

        // Present in the original React payload.
        public string? Model { get; set; }

        public float? Temperature { get; set; }

        public float? TopP { get; set; }

        public int? MaxTokens { get; set; }

        public float? FrequencyPenalty { get; set; }

        public float? PresencePenalty { get; set; }

        public List<string>? StopSequences { get; set; }
    }
}