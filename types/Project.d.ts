// eslint-disable-next-line

declare namespace Project {
  /**
   * Purpurina project creation metadata.
   */
  export interface Create {
    projectName: string;
    location: string;
    author?: string;
  }
  /**
   * Purpurina project package FI.
   */
  export interface Package {
    name: string;
    version?: string;
    thumbnail?: string;
    author?: string;
  }

  /**
   * Purpurina project metadata.
   */
  export interface Metadata {
    projectPackage: Package;
    error?: string;
    path: string;
    index: number;
  }
}