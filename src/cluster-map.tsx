import React, { ReactNode } from 'react';
import { StyleSheet, StyleProp, ViewProps } from 'react-native';
import GoogleMapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  MapViewProps,
} from 'react-native-maps';
import Supercluster from 'supercluster';

import { ClusterMarker } from './cluster-marker';

import { clusterService } from './cluster-service';
import * as utils from './utils';

export interface IClusterMapProps extends MapViewProps {
  superclusterOptions?: object;
  region: Region;
  children: Marker[];
  renderClusterMarker: (pointCount: number) => ReactNode;
  style: StyleProp<ViewProps>;
  onMapReady: () => void;
  onClusterClick: () => void;
  onRegionChangeComplete: (region: Region) => void;
}

interface IClusterMapState {
  markers:
    | Array<Supercluster.ClusterFeature<any>>
    | Array<Supercluster.PointFeature<any>>;
  isMapLoaded: boolean;
}

export class ClusterMap extends React.PureComponent<
  IClusterMapProps,
  IClusterMapState
> {
  public state: IClusterMapState = {
    markers: [],
    isMapLoaded: false,
  };

  public render() {
    const { style, region } = this.props;

    return (
      <GoogleMapView
        {...utils.serializeProps(this.props)}
        style={style || styles.map}
        onMapReady={this.onMapReady}
        initialRegion={region}
        onRegionChangeComplete={this.onRegionChangeComplete}
        provider={PROVIDER_GOOGLE}
      >
        {this.state.isMapLoaded && this.renderMarkers()}
      </GoogleMapView>
    );
  }

  public componentDidMount() {
    this.clusterize();
  }

  public componentWillReceiveProps(nextProps: IClusterMapProps) {
    const { children } = nextProps;
    if (clusterService.isMarkersChanged(children)) {
      this.clusterize();
    }
  }

  private generateMarkers(region: Region) {
    this.setState({
      markers: clusterService.getClusters(region),
    });
  }

  private onRegionChangeComplete = (region: Region) => {
    this.generateMarkers(region);
    this.props.onRegionChangeComplete &&
      this.props.onRegionChangeComplete(region);
  };

  private clusterize = () => {
    const { superclusterOptions, region, children } = this.props;

    clusterService.createClusters(superclusterOptions, children);
    this.generateMarkers(region);
  };

  private renderMarkers = () => {
    const { markers } = this.state;
    const { onClusterClick, renderClusterMarker } = this.props;

    return markers.map((marker) => {
      const { properties, geometry } = marker;
      const { cluster, item, point_count } = properties;

      const key = utils.makeId();

      if (!cluster && item) {
        return <Marker {...item.props} key={key} />;
      }

      return (
        <ClusterMarker
          pointCount={point_count}
          coordinates={geometry.coordinates}
          onClusterClick={onClusterClick}
          key={key}
        >
          {renderClusterMarker && renderClusterMarker(point_count)}
        </ClusterMarker>
      );
    });
  };

  private onMapReady = () => {
    this.setState(
      {
        isMapLoaded: true,
      },
      () => this.props.onMapReady && this.props.onMapReady()
    );
  };
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
