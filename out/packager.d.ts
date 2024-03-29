/// <reference types="node" />
import { Arch, DebugLogger, TmpDir } from "builder-util";
import { CancellationToken } from "builder-util-runtime";
import { EventEmitter } from "events";
import { Lazy } from "lazy-val";
import { AppInfo } from "./appInfo";
import { AfterPackContext, Configuration, Framework, Platform, SourceRepositoryInfo, Target } from "./index";
import { Metadata } from "./options/metadata";
import { ArtifactBuildStarted, ArtifactCreated, PackagerOptions } from "./packagerApi";
import { PlatformPackager } from "./platformPackager";
import { NodeModuleDirInfo } from "./util/packageDependencies";
export declare class Packager {
    readonly cancellationToken: CancellationToken;
    readonly projectDir: string;
    private _appDir;
    readonly appDir: string;
    private _metadata;
    readonly metadata: Metadata;
    private _nodeModulesHandledExternally;
    readonly areNodeModulesHandledExternally: boolean;
    private _isPrepackedAppAsar;
    readonly isPrepackedAppAsar: boolean;
    private _devMetadata;
    readonly devMetadata: Metadata | null;
    private _configuration;
    readonly config: Configuration;
    isTwoPackageJsonProjectLayoutUsed: boolean;
    readonly eventEmitter: EventEmitter;
    _appInfo: AppInfo | null;
    readonly appInfo: AppInfo;
    readonly tempDirManager: TmpDir;
    private _repositoryInfo;
    private readonly afterPackHandlers;
    readonly options: PackagerOptions;
    readonly debugLogger: DebugLogger;
    readonly repositoryInfo: Promise<SourceRepositoryInfo | null>;
    private nodeDependencyInfo;
    getNodeDependencyInfo(platform: Platform | null): Lazy<Array<NodeModuleDirInfo>>;
    stageDirPathCustomizer: (target: Target, packager: PlatformPackager<any>, arch: Arch) => string;
    private _buildResourcesDir;
    readonly buildResourcesDir: string;
    readonly relativeBuildResourcesDirname: string;
    private _framework;
    readonly framework: Framework;
    private readonly toDispose;
    disposeOnBuildFinish(disposer: () => Promise<void>): void;
    constructor(options: PackagerOptions, cancellationToken?: CancellationToken);
    addAfterPackHandler(handler: (context: AfterPackContext) => Promise<any> | null): void;
    artifactCreated(handler: (event: ArtifactCreated) => void): Packager;
    callArtifactBuildStarted(event: ArtifactBuildStarted, logFields?: any): Promise<void>;
    /**
     * Only for sub artifacts (update info), for main artifacts use `callArtifactBuildCompleted`.
     */
    dispatchArtifactCreated(event: ArtifactCreated): void;
    callArtifactBuildCompleted(event: ArtifactCreated): Promise<void>;
    build(): Promise<BuildResult>;
    _build(configuration: Configuration, metadata: Metadata, devMetadata: Metadata | null, repositoryInfo?: SourceRepositoryInfo): Promise<BuildResult>;
    private readProjectMetadataIfTwoPackageStructureOrPrepacked;
    private doBuild;
    private createHelper;
    private installAppDependencies;
    afterPack(context: AfterPackContext): Promise<any>;
}
export interface BuildResult {
    readonly outDir: string;
    readonly artifactPaths: Array<string>;
    readonly platformToTargets: Map<Platform, Map<string, Target>>;
    readonly configuration: Configuration;
}
