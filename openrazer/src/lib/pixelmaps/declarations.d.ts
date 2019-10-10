declare module 'svgson' {

  interface Node {
    name: string;
    type: string;
    value: string;
    attributes: any;
    children: Node[];
  }

  export default function svgson(svg: string): Promise<Node>;
}
