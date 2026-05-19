$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:8000'
$clientId = [guid]::NewGuid().ToString()

$prompt = 'Close-up photograph of a beautiful Black African woman with rich dark brown skin lying down at a luxury spa, eyes closed peacefully, receiving a facial mask treatment. She wears a white terrycloth headband and a fluffy white spa robe. A Black aesthetician with brown skin and dark manicured nails, wearing a white blouse with thin red-blue-white striped trim on the sleeve, gently applies a smooth terracotta-brown clay mask to her cheek using a soft white cosmetic brush. Warm natural light, shallow depth of field, soft focus background, editorial beauty photography, photorealistic, high detail skin texture, magazine quality'

$negative = 'blurry, low quality, deformed, distorted face, extra fingers, bad anatomy, bad hands, cartoon, illustration, painting, oversaturated, plastic skin, white skin, light skin, watermark, text'

$seed = Get-Random -Maximum 2147483647

$workflow = @{
  '1' = @{ class_type = 'UNETLoader'; inputs = @{ unet_name = 'z_image_turbo_nvfp4.safetensors'; weight_dtype = 'default' } }
  '2' = @{ class_type = 'CLIPLoader'; inputs = @{ clip_name = 'qwen_3_4b_fp8_mixed.safetensors'; type = 'qwen_image' } }
  '3' = @{ class_type = 'VAELoader'; inputs = @{ vae_name = 'ae.safetensors' } }
  '4' = @{ class_type = 'CLIPTextEncode'; inputs = @{ clip = @('2',0); text = $prompt } }
  '5' = @{ class_type = 'CLIPTextEncode'; inputs = @{ clip = @('2',0); text = $negative } }
  '6' = @{ class_type = 'EmptySD3LatentImage'; inputs = @{ width = 1152; height = 768; batch_size = 1 } }
  '7' = @{ class_type = 'KSampler'; inputs = @{
      model = @('1',0); seed = $seed; steps = 8; cfg = 3.0
      sampler_name = 'euler'; scheduler = 'simple'
      positive = @('4',0); negative = @('5',0); latent_image = @('6',0); denoise = 1.0
  } }
  '8' = @{ class_type = 'VAEDecode'; inputs = @{ samples = @('7',0); vae = @('3',0) } }
  '9' = @{ class_type = 'SaveImage'; inputs = @{ images = @('8',0); filename_prefix = 'karysm_spa_remake' } }
}

$body = @{ prompt = $workflow; client_id = $clientId } | ConvertTo-Json -Depth 10 -Compress
$resp = Invoke-RestMethod -Uri "$base/prompt" -Method Post -Body $body -ContentType 'application/json'
$promptId = $resp.prompt_id
Write-Host "Prompt queued: $promptId (seed=$seed)"

$start = Get-Date
while ($true) {
  Start-Sleep -Milliseconds 800
  $hist = Invoke-RestMethod -Uri "$base/history/$promptId" -Method Get
  if ($hist.PSObject.Properties.Name -contains $promptId) {
    $h = $hist.$promptId
    if ($h.status.completed) {
      $elapsed = ((Get-Date) - $start).TotalSeconds
      Write-Host ("Completed in {0:N1}s" -f $elapsed)
      $imgs = @()
      foreach ($n in $h.outputs.PSObject.Properties) {
        if ($n.Value.images) { foreach ($im in $n.Value.images) { $imgs += $im } }
      }
      foreach ($im in $imgs) {
        $url = "$base/view?filename=$($im.filename)&subfolder=$($im.subfolder)&type=$($im.type)"
        $out = "C:\Users\drama\Documents\DESPII\Karysm\test-results\$($im.filename)"
        Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
        Write-Host "Saved: $out"
      }
      break
    }
    if ($h.status.status_str -eq 'error') { Write-Host 'ERROR'; $h | ConvertTo-Json -Depth 10; break }
  }
  if (((Get-Date) - $start).TotalSeconds -gt 120) { Write-Host 'Timeout 120s'; break }
}
