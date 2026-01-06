{
  inputs = {
    automata.url = "github:shikanime-studio/automata";
    devenv.url = "github:cachix/devenv";
    devlib.url = "github:shikanime-studio/devlib";
    flake-parts.url = "github:hercules-ci/flake-parts";
    git-hooks.url = "github:cachix/git-hooks.nix";
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  nixConfig = {
    extra-substituters = [
      "https://cachix.cachix.org"
      "https://devenv.cachix.org"
      "https://shikanime.cachix.org"
      "https://shikanime-studio.cachix.org"
    ];
    extra-trusted-public-keys = [
      "cachix.cachix.org-1:eWNHQldwUO7G2VkjpnjDbWwy4KQ/HNxht7H4SSoMckM="
      "devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw="
      "shikanime.cachix.org-1:OrpjVTH6RzYf2R97IqcTWdLRejF6+XbpFNNZJxKG8Ts="
      "shikanime-studio.cachix.org-1:KxV6aDFU81wzoR9u6pF1uq0dQbUuKbodOSP8/EJHXO0="
    ];
  };

  outputs =
    inputs@{
      devenv,
      devlib,
      flake-parts,
      git-hooks,
      treefmt-nix,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        devenv.flakeModule
        devlib.flakeModule
        git-hooks.flakeModule
        treefmt-nix.flakeModule
      ];
      perSystem =
        { config, ... }:
        {
          devenv.shells.default = {
            imports = [
              devlib.devenvModules.docs
              devlib.devenvModules.formats
              devlib.devenvModules.javascript
              devlib.devenvModules.git
              devlib.devenvModules.github
              devlib.devenvModules.nix
              devlib.devenvModules.opentofu
              devlib.devenvModules.shell
              devlib.devenvModules.shikanime
            ];
            github = {
              actions = with config.devenv.shells.default.github.lib; {
                download-dist-artifacts = {
                  uses = "actions/download-artifact@v5";
                  "with".name = "dist";
                };

                npm-ci.run = mkWorkflowRun [
                  "nix"
                  "run"
                  "nixpkgs#nodejs"
                  "--command"
                  "npm"
                  "ci"
                ];

                npm-build.run = mkWorkflowRun [
                  "nix"
                  "run"
                  "nixpkgs#nodejs"
                  "--command"
                  "npm"
                  "run"
                  "build"
                ];

                upload-dist-artifacts = {
                  uses = "actions/upload-artifact@v5";
                  "with" = {
                    name = "dist";
                    path = "dist";
                  };
                };

                release-upload-dist-artifacts = {
                  env.GITHUB_TOKEN = mkWorkflowRef "steps.createGithubAppToken.outputs.token";
                  run = mkWorkflowRun [
                    "gh"
                    "release"
                    "upload"
                    (mkWorkflowRef "github.ref_name")
                    "--repo"
                    (mkWorkflowRef "github.repository")
                    "sapling-navigator.zip"
                  ];
                };

                zip-dist-artifacts.run = mkWorkflowRun [
                  "nix"
                  "run"
                  "nixpkgs#zip"
                  "--command"
                  "zip"
                  "-r"
                  "sapling-navigator.zip"
                  "dist/*"
                ];
              };

              workflows = with config.devenv.shells.default.github.lib; {
                release.settings.jobs = {
                  build = {
                    needs = [ "publish" ];
                    permissions.packages = "write";
                    "runs-on" = "ubuntu-latest";
                    steps = with config.devenv.shells.default.github.actions; [
                      create-github-app-token
                      checkout
                      setup-nix
                      npm-ci
                      npm-build
                      upload-dist-artifacts
                    ];
                  };

                  upload = {
                    permissions.packages = "write";
                    needs = [ "build" ];
                    "runs-on" = "ubuntu-latest";
                    steps = with config.devenv.shells.default.github.actions; [
                      create-github-app-token
                      checkout
                      download-dist-artifacts
                      zip-dist-artifacts
                      release-upload-dist-artifacts
                    ];
                  };
                };
              };
            };
          };
        };
      systems = [
        "x86_64-linux"
        "x86_64-darwin"
        "aarch64-linux"
        "aarch64-darwin"
      ];
    };
}
