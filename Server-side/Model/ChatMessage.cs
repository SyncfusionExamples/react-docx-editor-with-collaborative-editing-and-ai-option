
namespace CollaborativeEditingServerSide.Model
{
    public class ChatMessageRequest
    {
        public string Role { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;
    }
}