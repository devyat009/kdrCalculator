using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Windows.Forms;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace KdrCalculator.Tray
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            var builder = WebApplication.CreateBuilder(args);

            // Porta solicitada pelo usuário
            int port = 52010;
            builder.WebHost.UseUrls($"http://localhost:{port}");
            
            var app = builder.Build();

            // Configurar para usar o EmbeddedFileProvider
            var assembly = typeof(Program).Assembly;
            var embeddedProvider = new Microsoft.Extensions.FileProviders.ManifestEmbeddedFileProvider(assembly, "docs");

            app.UseDefaultFiles(new DefaultFilesOptions
            {
                FileProvider = embeddedProvider
            });

            // Serve static files from the Angular build
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = embeddedProvider
            });

            // Map all other requests to index.html (SPA Fallback)
            app.MapFallbackToFile("index.html", new StaticFileOptions
            {
                FileProvider = embeddedProvider
            });

            var apiTask = app.RunAsync();

            Application.Run(new FrontendTrayContext(app, port));
        }
    }

    class FrontendTrayContext : ApplicationContext
    {
        private NotifyIcon trayIcon;
        private WebApplication _app;
        private int _port;

        public FrontendTrayContext(WebApplication app, int port)
        {
            _app = app;
            _port = port;
            
            trayIcon = new NotifyIcon()
            {
                Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath),
                ContextMenuStrip = new ContextMenuStrip(),
                Visible = true,
                Text = "kdrCalculator Frontend"
            };

            trayIcon.DoubleClick += OpenBrowser;
            
            trayIcon.ContextMenuStrip.Items.Add("Abrir", null, OpenBrowser);
            trayIcon.ContextMenuStrip.Items.Add("Fechar", null, Exit);
        }

        private void OpenBrowser(object? sender, EventArgs e)
        {
            var url = $"http://localhost:{_port}";
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Não foi possível abrir o navegador: {ex.Message}");
            }
        }

        private async void Exit(object? sender, EventArgs e)
        {
            trayIcon.Visible = false;
            trayIcon.Dispose();
            Application.Exit();
            await _app.StopAsync();
        }
    }
}
