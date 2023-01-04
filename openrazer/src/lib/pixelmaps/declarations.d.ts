declare module 'svgson' {

  interface Node {
    name: string;
    type: string;
    value: string;
    attributes: {
      x: string;
      y: string;
      width: string;
      height: string;
    };
    children: Node[];
  }

  export default function svgson(svg: string): Promise<Node>;
}
