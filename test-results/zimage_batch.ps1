$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:8000'
$clientId = [guid]::NewGuid().ToString()

$negative = 'blurry, low quality, deformed, distorted face, extra fingers, bad anatomy, bad hands, cartoon, illustration, painting, oversaturated, plastic skin, white skin, light skin, watermark, text, logo, signature, multiple heads'

$jobs = @(
  @{ name = 'look_locs'; prompt = 'Editorial beauty portrait of a beautiful Black African woman with rich dark brown skin and long well-groomed locs styled into a high half-up bun, gold geometric earrings, soft glowing skin with a hint of highlighter, looking confidently slightly off-camera. Studio softbox lighting, warm beige backdrop, shallow depth of field, photorealistic, magazine quality, high detail skin texture, natural makeup'; w = 768; h = 1024 }
  @{ name = 'look_cut_crease'; prompt = 'Extreme close-up macro photography of a beautiful Black African womans eye area with rich dark brown skin, showing a flawless gold cut crease eyeshadow with sharp cut crease, perfectly winged liner, fluttery individual false lashes, defined eyebrows, dewy skin. Studio beauty lighting, photorealistic, high detail, magazine beauty editorial style'; w = 1024; h = 768 }
  @{ name = 'look_hair_care'; prompt = 'A Black African womans hands with rich dark brown skin scooping creamy whipped shea butter from a glass jar, surrounded by natural ingredients on a marble surface: avocado halves, jojoba oil bottle, wooden hair comb, dried hibiscus, neatly braided 4C hair coils. Top down flat lay, warm natural light, magazine editorial, photorealistic, high detail'; w = 1024; h = 1024 }
  @{ name = 'look_pedicure'; prompt = 'A Black African womans feet with rich dark brown skin resting on a folded white towel during a luxury pedicure, freshly painted nails with a soft pearlescent nude color and tiny gold geometric nail art accents, manicurists hands with dark skin holding a small white brush adding finishing touches. Soft warm spa lighting, photorealistic, top angle, magazine quality, high detail skin texture'; w = 1024; h = 768 }
  @{ name = 'look_hot_stone'; prompt = 'A Black African woman with rich dark brown skin lying face down on a white towel-covered massage table at a luxury spa, smooth dark heated basalt stones arranged in a line along her smooth glowing back, a calm masseuses hands with dark skin gently placing a stone on her shoulder. Warm candlelight, soft focus, eucalyptus and bamboo decor in the background, photorealistic, editorial spa photography, high detail skin texture'; w = 1024; h = 768 }
  @{ name = 'look_lace_wig'; prompt = 'Editorial fashion photograph of a beautiful Black African woman with rich dark brown skin wearing a sleek straight long bone-straight lace front wig with deep middle part and natural baby hairs laid down at the hairline, glossy nude lips, glowing skin, glamorous look. Studio beauty lighting, soft beige backdrop, shoulders visible, photorealistic, magazine fashion editorial style, high detail'; w = 768; h = 1024 }
)

$results = @()
foreach ($job in $jobs) {
  $seed = Get-Random -Maximum 2147483647
  $workflow = @{
    '1' = @{ class_type = 'UNETLoader'; inputs = @{ unet_name = 'z_image_turbo_nvfp4.safetensors'; weight_dtype = 'default' } }
    '2' = @{ class_type = 'CLIPLoader'; inputs = @{ clip_name = 'qwen_3_4b_fp8_mixed.safetensors'; type = 'qwen_image' } }
    '3' = @{ class_type = 'VAELoader'; inputs = @{ vae_name = 'ae.safetensors' } }
    '4' = @{ class_type = 'CLIPTextEncode'; inputs = @{ clip = @('2',0); text = $job.prompt } }
    '5' = @{ class_type = 'CLIPTextEncode'; inputs = @{ clip = @('2',0); text = $negative } }
    '6' = @{ class_type = 'EmptySD3LatentImage'; inputs = @{ width = $job.w; height = $job.h; batch_size = 1 } }
    '7' = @{ class_type = 'KSampler'; inputs = @{
        model = @('1',0); seed = $seed; steps = 8; cfg = 3.0
        sampler_name = 'euler'; scheduler = 'simple'
        positive = @('4',0); negative = @('5',0); latent_image = @('6',0); denoise = 1.0
    } }
    '8' = @{ class_type = 'VAEDecode'; inputs = @{ samples = @('7',0); vae = @('3',0) } }
    '9' = @{ class_type = 'SaveImage'; inputs = @{ images = @('8',0); filename_prefix = "karysm_$($job.name)" } }
  }

  $body = @{ prompt = $workflow; client_id = $clientId } | ConvertTo-Json -Depth 10 -Compress
  $resp = Invoke-RestMethod -Uri "$base/prompt" -Method Post -Body $body -ContentType 'application/json'
  $promptId = $resp.prompt_id
  Write-Host "[$($job.name)] queued: $promptId seed=$seed"

  $start = Get-Date
  while ($true) {
    Start-Sleep -Milliseconds 800
    $hist = Invoke-RestMethod -Uri "$base/history/$promptId" -Method Get
    if ($hist.PSObject.Properties.Name -contains $promptId) {
      $h = $hist.$promptId
      if ($h.status.completed) {
        $elapsed = ((Get-Date) - $start).TotalSeconds
        Write-Host ("[$($job.name)] completed in {0:N1}s" -f $elapsed)
        foreach ($n in $h.outputs.PSObject.Properties) {
          if ($n.Value.images) {
            foreach ($im in $n.Value.images) {
              $url = "$base/view?filename=$($im.filename)&subfolder=$($im.subfolder)&type=$($im.type)"
              $out = "C:\Users\drama\Documents\DESPII\Karysm\test-results\$($im.filename)"
              Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
              $results += [pscustomobject]@{ name = $job.name; png = $out }
              Write-Host "[$($job.name)] saved: $out"
            }
          }
        }
        break
      }
      if ($h.status.status_str -eq 'error') {
        Write-Host "[$($job.name)] ERROR"; $h | ConvertTo-Json -Depth 10
        break
      }
    }
    if (((Get-Date) - $start).TotalSeconds -gt 120) { Write-Host "[$($job.name)] TIMEOUT"; break }
  }
}

$lookbookDir = 'C:\Users\drama\Documents\DESPII\Karysm\apps\mobile\assets\images\lookbook'
foreach ($r in $results) {
  $webp = Join-Path $lookbookDir "$($r.name).webp"
  & ffmpeg -y -loglevel error -i $r.png -vf "scale=800:-2" -c:v libwebp -quality 82 -compression_level 6 $webp
  if (Test-Path $webp) { Write-Host "Converted: $webp ($((Get-Item $webp).Length) bytes)" }
}

Write-Host "Done."
