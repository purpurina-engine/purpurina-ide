import FileWatcher from '../systems/FileWatcher';
import Importer from 'main/systems/Importer';

/**
 * Controls the project systems.
 */
export default class ProjectManager {
  private metadata: Project.Metadata;
  isReady: boolean;
  watcher: FileWatcher;
  importer: Importer;

  /**
   * Get project path.
   */
  public get path(): string {
    return this.metadata.path;
  }

  public constructor(projectInfo: Project.Metadata) {
    this.metadata = projectInfo;
    this.isReady = false;
  }

  static openProject(projectInfo: Project.Metadata): Promise<ProjectManager> {
    return new Promise<ProjectManager>((resolve, reject) => {
      const manager = new ProjectManager(projectInfo);
      // Starting systems
      const watcher = new FileWatcher(projectInfo.path);
      watcher
        .start(manager.metadata.path)
        .then(() => {
          manager.watcher = watcher;
          manager.importer = new Importer(manager);
          manager.isReady = true;

          resolve(manager);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  // public send(message: string, payload: IMessage): void {

  // }
}
