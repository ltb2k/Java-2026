import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Mushroom-IoT')),
    body: ListView(padding: const EdgeInsets.all(16), children: [
      const Text('Khay của tôi',style: TextStyle(fontSize:24,fontWeight:FontWeight.bold)),
      const SizedBox(height:16),
      Card(child: Padding(padding: const EdgeInsets.all(16),child: Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
        const Text('TRAY-A101',style:TextStyle(fontSize:20,fontWeight:FontWeight.bold)),
        const SizedBox(height:8), const Text('Nấm Bào Ngư Xám'),
        const SizedBox(height:16),
        Row(mainAxisAlignment:MainAxisAlignment.spaceAround,children:[
          _metric('25.8°C','Nhiệt độ'),_metric('89.2%','Độ ẩm'),_metric('640','CO₂ ppm')
        ])
      ]))),
      const SizedBox(height:12),
      Card(child: ListTile(leading:const Icon(Icons.videocam),title:const Text('Camera trực tuyến'),subtitle:const Text('Xem tiến trình phát triển của khay'))),
      Card(child: ListTile(leading:const Icon(Icons.notifications),title:const Text('Thông báo'),subtitle:const Text('Môi trường, tiến độ và thu hoạch'))),
    ]),
  );
}
Widget _metric(String value,String label)=>Column(children:[Text(value,style:const TextStyle(fontSize:18,fontWeight:FontWeight.bold)),Text(label,style:const TextStyle(fontSize:11,color:Colors.grey))]);
