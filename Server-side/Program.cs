using CollaborativeEditingServerSide.Configuration;
using CollaborativeEditingServerSide.Hubs;
using CollaborativeEditingServerSide.Service;
using Microsoft.Azure.SignalR;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", builder =>
    {
        builder.AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

builder.Services.Configure<AIOptions>(builder.Configuration.GetSection("AI"));

// Azure OpenAI Configuration
builder.Services.Configure<AzureOpenAIOptions>(builder.Configuration.GetSection("AzureOpenAI"));

#region Register AI Provider

AIOptions? aiOptions = builder.Configuration.GetSection("AI").Get<AIOptions>() ?? new AIOptions();

switch (aiOptions.Provider.ToLowerInvariant())
{
    case "azureopenai":

        builder.Services.AddSingleton<IAIProvider, AzureOpenAIProvider>();
        break;

    // case "claudeai":

    //     builder.Services.AddSingleton<IAIProvider, ClaudeProvider>();
    //     break;

    // case "geminiai":

    //     builder.Services.AddSingleton<IAIProvider, GeminiProvider>();
    //     break;

    default:
        throw new InvalidOperationException(
            $"Unsupported AI Provider : {aiOptions.Provider}");
}

#endregion

var config = builder.Configuration;
var redisConfig = config.GetSection("ConnectionStrings");
var connectionString = redisConfig["RedisConnectionString"] ?? throw new InvalidOperationException("RedisConnectionString is not configured");

//Configure SignalR
builder.Services.AddSignalR().AddStackExchangeRedis(connectionString, options =>
{
    options.Configuration.ChannelPrefix = RedisChannel.Literal("docedit");
});


builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = connectionString;
});

builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = ConfigurationOptions.Parse(connectionString, true);
    return ConnectionMultiplexer.Connect(configuration);
});

builder.Services.AddSingleton<IBackgroundTaskQueue>(ctx =>
{
    //Configure maximum queue capacity.
    return new BackgroundTaskQueue(200);
});
builder.Services.AddHostedService<QueuedHostedService>();
builder.Services.AddScoped<IAzureDocumentStorageService, AzureDocumentStorageService>();

var app = builder.Build();

app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowAllOrigins");
app.UseAuthorization();

app.MapHub<DocumentEditorHub>("/documenteditorhub");

app.MapControllers();

app.MapControllerRoute(
       name: "default",
       pattern: "{controller=Home}/{action=LogIn}/{userName?}/{id?}");
app.Run();
