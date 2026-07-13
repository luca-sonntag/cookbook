# Minimal image to run Fastlane's `supply` (Google Play upload).
#
# The signed AAB is built locally (release.ps1) and mounted in at runtime, so
# this image only needs Ruby + Fastlane — keeping Ruby off the host machine.
# build-essential is required to compile Fastlane's native gem dependencies;
# git is used by some Fastlane actions.
FROM ruby:3.3-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential git \
 && rm -rf /var/lib/apt/lists/*

RUN gem install fastlane --no-document

# The fastlane config dir (Fastfile/Appfile) is mounted here at runtime.
WORKDIR /fastlane

ENTRYPOINT ["fastlane"]
CMD ["internal"]
