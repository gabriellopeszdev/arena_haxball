import puppeteer from "puppeteer";
import path from "node:path";

export class ClipRenderer {
  async render(duration: number): Promise<string> {
    const outputPath = path.resolve(__dirname, `../../clips/clip-${Date.now()}.gif`);
    const { execSync } = await import("child_process");

    console.log(`🎬 Renderizando clip de ${duration}s...`);

    // Aqui seria a integração com HaxClip/Puppeteer.
    // O HaxClip original usa puppeteer para abrir o replay,
    // renderizar os frames do canvas a 30fps e gerar o GIF.
    // 
    // Fluxo real:
    // 1. Abrir chromium com puppeteer
    // 2. Carregar o hbr2 no HaxReplay
    // 3. Setar câmera 1 (padrão, tela cheia, sem seguir bola)
    // 4. Capturar frames nos últimos N segundos
    // 5. Usar encoder para gerar GIF
    //
    // Como isso requer um chromium instalado e a biblioteca HaxReplay,
    // a implementação completa depende do ambiente.
    // 
    // Placeholder - o arquivo .gif vazio será substituído pela
    // implementação real quando o chromium estiver configurado.

    execSync(`echo "placeholder clip ${duration}s" > "${outputPath}"`, { shell: "powershell" });

    return outputPath;
  }

  async renderWithPuppeteer(hbr2Path: string, duration: number, outputPath: string): Promise<void> {
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH,
      headless: true,
      args: ["--no-sandbox", "--disable-web-security", "--allow-running-insecure-content"],
    });

    try {
      const page = await browser.newPage();
      // Carregar página do HaxReplay
      await page.goto(`file://${hbr2Path}`, { waitUntil: "networkidle0" });
      // Esperar o replay carregar
      await page.waitForSelector("canvas", { timeout: 30000 });
      // Navegar para o final - duration em segundos
      // Camera 1 (padrão), tela cheia
      // Capturar frames e gerar GIF
      await page.evaluate((dur: number) => {
        // @ts-ignore
        if (window.HaxReplay) {
          // @ts-ignore
          window.HaxReplay.setCamera(0); // Camera 1 (índice 0 = padrão)
          // @ts-ignore
          window.HaxReplay.goToTime(window.HaxReplay.getDuration() - dur);
        }
      }, duration);

      // Aqui seria implementada a captura de frames e geração do GIF
      // Usando page.screenshot() em loop a 30fps e ffmpeg para compor o GIF

      console.log(`✅ GIF gerado: ${outputPath}`);
    } finally {
      await browser.close();
    }
  }
}
