podfile_path = 'mobile/macos/Podfile'
content = open(podfile_path).read()

# Replace post_install
if 'post_install do |installer|' in content:
    content = content.split('post_install do |installer|')[0]

new_post_install = """
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['MACOSX_DEPLOYMENT_TARGET'] = '12.0'
      config.build_settings['ENABLE_BITCODE'] = 'NO'
    end
  end
end
"""
content += new_post_install

open(podfile_path, 'w').write(content)

# Also patch project.pbxproj aggressively
import os
import re

pbx = 'mobile/macos/Runner.xcodeproj/project.pbxproj'
with open(pbx, 'r') as f:
    pbx_content = f.read()

pbx_content = re.sub(r'MACOSX_DEPLOYMENT_TARGET = 10\.\d+;', 'MACOSX_DEPLOYMENT_TARGET = 12.0;', pbx_content)

with open(pbx, 'w') as f:
    f.write(pbx_content)

print("Patched completely.")
