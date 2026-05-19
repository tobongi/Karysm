$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:8000'
$clientId = [guid]::NewGuid().ToString()
$STEPS = 25
$CFG = 3.0

$jobs = Get-Content "C:\Users\drama\Documents\DESPII\Karysm\test-results\zimage_v2_redo12.json" -Raw | ConvertFrom-Json

$negative = 'nude, naked, topless, shirtless, bare chest, bare shoulders, exposed chest, exposed cleavage, cleavage, breasts, nipples, lingerie, underwear, undressed, no clothes, no shirt, nsfw, suggestive, sexual, blurry, low quality, deformed, distorted face, extra fingers, bad anatomy, bad hands, cartoon, illustration, painting, oversaturated, plastic skin, white skin, light skin, watermark, text, logo, signature, multiple heads, mutated, deformed pupils'

$lookbookDir = 'C:\Users\drama\Documents\DESPII\Karysm\apps\mobile\assets\images\lookbook'
$pngDir = 'C:\Users\drama\Documents\DESPII\Karysm\test-results\v2_png'
New-Item -ItemType Directory -Force -Path $pngDir | Out-Null

$startAll = Get-Date
for ($i = 0; $i -lt $jobs.Count; $i++) {
  $job = $jobs[$i]
  $idx = $i + 1
  $seed = Get-Random -Maximum 2147483647

  $workflow = @{
    '1' = @{ class_type = 'UNETLoader'; inputs = @{ unet_name = 'z_image_turbo_nvfp4.safetensors'; weight_dtype = 'default' } }
    '2' = @{ class_type = 'CLIPLoader'; inputs = @{ clip_name = 'qwen_3_4b_fp8_mixed.safetensors'; type = 'qwen_image' } }
    '3' = @{ class_type = 'VAELoader'; inputs = @{ vae_name = 'ae.safetensors' } }
    '4' = @{ class_type = 'CLIPTextEncode'; inputs = @{ clip = @('2',0); text = $job.prompt } }
    '5' = @{ class_type = 'CLIPTextEncode'; inputs = @{ clip = @('2',0); text = $negative } }
    '6' = @{ class_type = 'EmptySD3LatentImage'; inputs = @{ width = [int]$job.w; height = [int]$job.h; batch_size = 1 } }
    '7' = @{ class_type = 'KSampler'; inputs = @{
        model = @('1',0); seed = $seed; steps = $STEPS; cfg = $CFG
        sampler_name = 'euler'; scheduler = 'simple'
        positive = @('4',0); negative = @('5',0); latent_image = @('6',0); denoise = 1.0
    } }
    '8' = @{ class_type = 'VAEDecode'; inputs = @{ samples = @('7',0); vae = @('3',0) } }
    '9' = @{ class_type = 'SaveImage'; inputs = @{ images = @('8',0); filename_prefix = "karysm_v2redo_$($job.name)" } }
  }

  $body = @{ prompt = $workflow; client_id = $clientId } | ConvertTo-Json -Depth 10 -Compress
  $resp = Invoke-RestMethod -Uri "$base/prompt" -Method Post -Body $body -ContentType 'application/json'
  $promptId = $resp.prompt_id

  $jobStart = Get-Date
  while ($true) {
    Start-Sleep -Milliseconds 1200
    $hist = Invoke-RestMethod -Uri "$base/history/$promptId" -Method Get
    if ($hist.PSObject.Properties.Name -contains $promptId) {
      $h = $hist.$promptId
      if ($h.status.completed) {
        $elapsed = ((Get-Date) - $jobStart).TotalSeconds
        foreach ($n in $h.outputs.PSObject.Properties) {
          if ($n.Value.images) {
            foreach ($im in $n.Value.images) {
              $url = "$base/view?filename=$($im.filename)&subfolder=$($im.subfolder)&type=$($im.type)"
              $out = Join-Path $pngDir "karysm_v2_$($job.name)_00001_.png"
              Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
              $webp = Join-Path $lookbookDir "look_$($job.name).webp"
              & ffmpeg -y -loglevel error -i $out -vf "scale=900:-2" -c:v libwebp -quality 84 -compression_level 6 $webp
              if (Test-Path $webp) {
                $sz = (Get-Item $webp).Length
                Write-Host ("[$idx/$($jobs.Count)] [$($job.name)] {0:N1}s -> {1} ({2} KB)" -f $elapsed, (Split-Path $webp -Leaf), [int]($sz/1024))
              }
            }
          }
        }
        break
      }
      if ($h.status.status_str -eq 'error') { Write-Host "[$idx/$($jobs.Count)] [$($job.name)] ERROR"; break }
    }
    if (((Get-Date) - $jobStart).TotalSeconds -gt 300) { Write-Host "[$idx/$($jobs.Count)] [$($job.name)] TIMEOUT"; break }
  }
}
$totalElapsed = ((Get-Date) - $startAll).TotalSeconds
Write-Host ("=== REDO DONE in {0:N1}s ===" -f $totalElapsed)
