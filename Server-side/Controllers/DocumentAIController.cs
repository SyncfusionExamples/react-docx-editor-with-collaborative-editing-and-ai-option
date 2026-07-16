using CollaborativeEditingServerSide.Model;
using CollaborativeEditingServerSide.Service;
using Microsoft.AspNetCore.Mvc;

namespace CollaborativeEditingServerSide.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentAIController : ControllerBase
    {
        private readonly IAIProvider _provider;
        public DocumentAIController(IAIProvider aIProvider)
        {
            _provider = aIProvider;
        }

        /// <summary>
        /// Receives chat messages from the React application and forwards them to Azure OpenAI.
        /// </summary>
        [HttpPost("Process")]
        [ProducesResponseType(typeof(ChatResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ChatResponse>> Process([FromBody] ChatRequest request)
        {
            if (request == null)
            {
                return BadRequest("Request cannot be null.");
            }

            if (request.Messages == null || request.Messages.Count == 0)
            {
                return BadRequest("At least one message is required.");
            }

            try
            {
                var generatedText = await _provider.CompleteChatAsync(request);

                return Ok(new ChatResponse
                {
                    Text = generatedText
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new
                    {
                        Message = "An error occurred while communicating with Azure OpenAI.",
                        Details = ex.Message
                    });
            }
        }
    }
}