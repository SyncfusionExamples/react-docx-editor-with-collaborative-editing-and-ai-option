using Azure;
using Azure.AI.OpenAI;
using CollaborativeEditingServerSide.Model;
using Microsoft.Extensions.Options;
using OpenAI.Chat;
using CollaborativeEditingServerSide.Configuration;

namespace CollaborativeEditingServerSide.Service
{
public class AzureOpenAIProvider : IAIProvider
{
    private readonly ChatClient _chatClient;

    public AzureOpenAIProvider(IOptions<AzureOpenAIOptions> options)
    {
        var settings = options.Value;

        if (string.IsNullOrWhiteSpace(settings.Endpoint))
            throw new InvalidOperationException("Azure OpenAI Endpoint is missing.");

        if (string.IsNullOrWhiteSpace(settings.ApiKey))
            throw new InvalidOperationException("Azure OpenAI API Key is missing.");

        if (string.IsNullOrWhiteSpace(settings.DeploymentName))
            throw new InvalidOperationException("Azure OpenAI Deployment Name is missing.");

        var client = new AzureOpenAIClient(
            new Uri(settings.Endpoint),
            new AzureKeyCredential(settings.ApiKey));

        _chatClient = client.GetChatClient(settings.DeploymentName);
    }

    public async Task<string> CompleteChatAsync(ChatRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Messages == null || request.Messages.Count == 0)
            throw new ArgumentException("At least one chat message is required.");

        var chatMessages = new List<ChatMessage>();

        foreach (var message in request.Messages)
        {
            switch (message.Role.ToLower())
            {
                case "system":
                    chatMessages.Add(new SystemChatMessage(message.Content));
                    break;

                case "assistant":
                    chatMessages.Add(new AssistantChatMessage(message.Content));
                    break;

                case "user":
                default:
                    chatMessages.Add(new UserChatMessage(message.Content));
                    break;
            }
        }

        var options = new ChatCompletionOptions();

        if (request.Temperature.HasValue)
            options.Temperature = request.Temperature.Value;

        if (request.TopP.HasValue)
            options.TopP = request.TopP.Value;

        if (request.FrequencyPenalty.HasValue)
            options.FrequencyPenalty = request.FrequencyPenalty.Value;

        if (request.PresencePenalty.HasValue)
            options.PresencePenalty = request.PresencePenalty.Value;

        if (request.MaxTokens.HasValue)
            options.MaxOutputTokenCount = request.MaxTokens.Value;

        if (request.StopSequences != null)
        {
            foreach (var stop in request.StopSequences)
            {
                options.StopSequences.Add(stop);
            }
        }

        ChatCompletion completion =
            await _chatClient.CompleteChatAsync(chatMessages, options);

        return completion.Content[0].Text;
    }
}
}