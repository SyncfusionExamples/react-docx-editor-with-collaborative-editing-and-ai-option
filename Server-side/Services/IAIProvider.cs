
using CollaborativeEditingServerSide.Model;

namespace CollaborativeEditingServerSide.Service
{
    public interface IAIProvider
    {
        Task<string> CompleteChatAsync(ChatRequest request);
    }
}